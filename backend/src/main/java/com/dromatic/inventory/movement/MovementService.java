package com.dromatic.inventory.movement;

import com.dromatic.inventory.common.event.StockChangedEvent;
import com.dromatic.inventory.common.exception.BusinessException;
import com.dromatic.inventory.common.exception.InsufficientStockException;
import com.dromatic.inventory.common.exception.ResourceNotFoundException;
import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.item.ItemRepository;
import com.dromatic.inventory.item.ItemService;
import com.dromatic.inventory.lot.Lot;
import com.dromatic.inventory.lot.LotRepository;
import com.dromatic.inventory.lot.LotService;
import com.dromatic.inventory.lot.Stock;
import com.dromatic.inventory.lot.StockRepository;
import com.dromatic.inventory.lot.StockView;
import com.dromatic.inventory.map.MapService;
import com.dromatic.inventory.map.Rack;
import com.dromatic.inventory.module.InventoryModule;
import com.dromatic.inventory.module.ModulePermissionService;
import com.dromatic.inventory.movement.MovementRequests.*;
import com.dromatic.inventory.security.CurrentUserService;
import com.dromatic.inventory.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Único lugar donde cambian las cantidades. Cada cambio deja un movimiento en el
 * historial con quién lo hizo, cuándo, desde dónde y hacia dónde.
 */
@Service
@RequiredArgsConstructor
public class MovementService {

    private static final int SCALE = 3;
    private static final BigDecimal MAX_QUANTITY = new BigDecimal("10000000");

    private final MovementRepository movementRepository;
    private final ItemRepository itemRepository;
    private final ItemService itemService;
    private final LotRepository lotRepository;
    private final StockRepository stockRepository;
    private final MapService mapService;
    private final ModulePermissionService permissionService;
    private final CurrentUserService currentUserService;
    private final ApplicationEventPublisher events;

    /** Ubicación ya validada: estantería + piso, o nota escrita, o ninguna. */
    record Place(Rack rack, Integer level, String note) {

        String label() {
            if (rack != null) {
                return rack.locationName(level);
            }
            return note != null ? note : StockView.NO_LOCATION;
        }

        boolean sameAs(Place other) {
            if (rack != null || other.rack != null) {
                return rack != null && other.rack != null && rack.getId().equals(other.rack.getId())
                        && Objects.equals(level, other.level);
            }
            return Objects.equals(note, other.note);
        }
    }

    /** Cantidad ya calculada a partir de lo escrito. */
    record Quantity(BigDecimal total, BigDecimal containers, String containerName, BigDecimal unitsPerContainer,
                    BigDecimal weightKg) {
    }

    // ─── Entrada ────────────────────────────────────────────────────────

    @Transactional
    public Long entry(EntryRequest r) {
        User user = currentUserService.currentUser();
        Item item;
        Lot lot = null;
        if (r.lotId() != null) {
            lot = lotRepository.findFull(r.lotId())
                    .orElseThrow(() -> new ResourceNotFoundException("El rótulo escogido no existe."));
            item = lot.getItem();
            if (r.itemId() != null && !r.itemId().equals(item.getId())) {
                throw new BusinessException("El rótulo escogido es de otro artículo.");
            }
        } else if (r.itemId() != null) {
            item = itemRepository.findWithModule(r.itemId())
                    .orElseThrow(() -> new ResourceNotFoundException("El artículo no existe."));
        } else if (r.newItem() != null) {
            item = itemService.create(r.newItem());
        } else {
            throw new BusinessException("Escoja el artículo o escriba el nombre de uno nuevo.");
        }
        permissionService.requireEdit(user, item.getModule());
        if (Item.INACTIVO.equals(item.getStatus())) {
            item.setStatus(Item.ACTIVO);
        }

        if (lot == null) {
            if (r.label() == null) {
                throw new BusinessException("Llene el rótulo: como mínimo la fecha y el tipo de material.");
            }
            lot = Lot.builder().item(item).createdBy(user).verified(true).build();
            LotService.applyLabel(lot, r.label());
            lot = lotRepository.save(lot);
        }

        Quantity q = resolve(r.quantity());
        Place place = resolvePlace(r.location(), item.getModule(), false);
        Stock stock = stockAt(lot, place);
        stock.setQuantity(stock.getQuantity().add(q.total()));
        if (q.weightKg() != null) {
            stock.setWeightKg(zeroIfNull(stock.getWeightKg()).add(q.weightKg()));
        }
        if (q.containerName() != null) {
            stock.setContainerName(q.containerName());
        }
        if (q.unitsPerContainer() != null) {
            stock.setUnitsPerContainer(q.unitsPerContainer());
        }
        if (q.containerName() != null && q.unitsPerContainer() != null) {
            // Se propone en la próxima entrada del mismo artículo.
            item.setLastContainerName(q.containerName());
            item.setLastUnitsPerContainer(q.unitsPerContainer());
        }

        Movement m = base(MovementEffect.ENTRADA, r.movementType(), item, lot, q, user, r.reason(), r.note(),
                r.reference(), r.movementDate());
        m.setStockDelta(q.total());
        setTo(m, place);
        movementRepository.save(m);
        events.publishEvent(new StockChangedEvent(item.getId()));
        return m.getId();
    }

    // ─── Salida ─────────────────────────────────────────────────────────

    @Transactional
    public List<Long> exit(ExitRequest r) {
        User user = currentUserService.currentUser();
        Set<Long> seen = new HashSet<>();
        Set<Long> changedItems = new LinkedHashSet<>();
        List<Long> ids = new ArrayList<>();
        for (ExitLine line : r.lines()) {
            if (!seen.add(line.stockId())) {
                throw new BusinessException("El mismo rótulo y ubicación aparece dos veces. Sume las cantidades en una sola línea.");
            }
            Stock stock = lockStock(line.stockId());
            Lot lot = stock.getLot();
            Item item = lot.getItem();
            permissionService.requireEdit(user, item.getModule());

            Quantity q = resolve(line.quantity());
            Place from = placeOf(stock);
            requireAvailable(stock, q.total(), item, from);
            BigDecimal weightOut = portionWeight(stock, q.total(), q.weightKg());
            takeFrom(stock, q.total(), weightOut);

            Movement m = base(MovementEffect.SALIDA, r.movementType(), item, lot, q, user, r.reason(), r.note(),
                    r.reference(), r.movementDate());
            m.setStockDelta(q.total().negate());
            m.setWeightKg(weightOut);
            setFrom(m, from);
            movementRepository.save(m);
            ids.add(m.getId());
            changedItems.add(item.getId());
        }
        changedItems.forEach(id -> events.publishEvent(new StockChangedEvent(id)));
        return ids;
    }

    // ─── Traslado ───────────────────────────────────────────────────────

    @Transactional
    public Long transfer(TransferRequest r) {
        User user = currentUserService.currentUser();
        Stock source = lockStock(r.stockId());
        Lot lot = source.getLot();
        Item item = lot.getItem();
        permissionService.requireEdit(user, item.getModule());

        boolean hasQuantity = r.quantity() != null
                && (r.quantity().total() != null || r.quantity().containers() != null);
        Quantity q = hasQuantity ? resolve(r.quantity())
                : new Quantity(source.getQuantity(), null, source.getContainerName(), source.getUnitsPerContainer(), null);
        Place from = placeOf(source);
        Place to = resolvePlace(r.to(), item.getModule(), true);
        if (from.sameAs(to)) {
            throw new BusinessException("El origen y el destino son el mismo lugar.");
        }
        requireAvailable(source, q.total(), item, from);
        BigDecimal weight = portionWeight(source, q.total(), q.weightKg());

        Stock target = stockAt(lot, to);
        target.setQuantity(target.getQuantity().add(q.total()));
        if (weight != null) {
            target.setWeightKg(zeroIfNull(target.getWeightKg()).add(weight));
        }
        if (target.getContainerName() == null) {
            target.setContainerName(source.getContainerName());
            target.setUnitsPerContainer(source.getUnitsPerContainer());
        }
        takeFrom(source, q.total(), weight);

        Movement m = base(MovementEffect.TRASLADO, r.movementType(), item, lot, q, user, r.reason(), r.note(),
                null, r.movementDate());
        m.setStockDelta(BigDecimal.ZERO.setScale(SCALE));
        m.setWeightKg(weight);
        setFrom(m, from);
        setTo(m, to);
        movementRepository.save(m);
        return m.getId();
    }

    // ─── Ajuste por conteo físico ───────────────────────────────────────

    @Transactional
    public Long adjust(AdjustRequest r) {
        User user = currentUserService.currentUser();
        Stock stock = lockStock(r.stockId());
        Lot lot = stock.getLot();
        Item item = lot.getItem();
        permissionService.requireEdit(user, item.getModule());

        BigDecimal counted = scale(r.countedQuantity());
        BigDecimal delta = counted.subtract(stock.getQuantity());
        BigDecimal countedWeight = r.countedWeightKg() == null ? null : scale(r.countedWeightKg());
        boolean weightChanges = countedWeight != null
                && (stock.getWeightKg() == null || countedWeight.compareTo(stock.getWeightKg()) != 0);
        if (delta.signum() == 0 && !weightChanges) {
            throw new BusinessException("Lo contado es igual a lo registrado: no hay nada que ajustar.");
        }
        Place place = placeOf(stock);
        Quantity q = new Quantity(delta.abs(), null, null, null,
                weightChanges ? countedWeight.subtract(zeroIfNull(stock.getWeightKg())).abs() : null);

        Movement m = base(MovementEffect.AJUSTE, r.movementType(), item, lot, q, user, r.reason(),
                withCount(r.note(), stock.getQuantity(), counted, item.getUnitName()), null, r.movementDate());
        m.setStockDelta(delta);
        setFrom(m, place);
        setTo(m, place);
        movementRepository.save(m);

        stock.setQuantity(counted);
        if (countedWeight != null) {
            stock.setWeightKg(countedWeight);
        }
        removeIfEmpty(stock);
        events.publishEvent(new StockChangedEvent(item.getId()));
        return m.getId();
    }

    // ─── Anulación (solo administrador) ─────────────────────────────────

    /** Deshace el efecto del movimiento y lo marca como anulado; nunca se borra. */
    @Transactional
    public Long voidMovement(Long id, VoidRequest r) {
        Movement m = movementRepository.findFull(id)
                .orElseThrow(() -> new ResourceNotFoundException("El movimiento no existe."));
        if (Boolean.TRUE.equals(m.getVoided())) {
            throw new BusinessException("Este movimiento ya estaba anulado.");
        }
        Lot lot = m.getLot();
        Place from = new Place(m.getFromRack(), m.getFromLevel(), m.getFromNote());
        Place to = new Place(m.getToRack(), m.getToLevel(), m.getToNote());
        BigDecimal qty = m.getQuantity();
        BigDecimal weight = m.getWeightKg();

        switch (m.getEffect()) {
            case ENTRADA -> removeForVoid(lot, to, qty, weight);
            case SALIDA -> addForVoid(lot, from, qty, weight);
            case TRASLADO -> {
                removeForVoid(lot, to, qty, weight);
                addForVoid(lot, from, qty, weight);
            }
            case AJUSTE -> {
                if (m.getStockDelta().signum() > 0) {
                    removeForVoid(lot, from, m.getStockDelta(), null);
                } else if (m.getStockDelta().signum() < 0) {
                    addForVoid(lot, from, m.getStockDelta().negate(), null);
                }
            }
        }
        m.setVoided(true);
        m.setVoidedAt(LocalDateTime.now());
        m.setVoidedBy(currentUserService.currentUser());
        m.setVoidReason(r.reason().trim());
        events.publishEvent(new StockChangedEvent(m.getItem().getId()));
        return m.getId();
    }

    // ─── Ayudas ─────────────────────────────────────────────────────────

    private void removeForVoid(Lot lot, Place place, BigDecimal qty, BigDecimal weight) {
        Stock stock = findStock(lot, place).orElse(null);
        if (stock == null || stock.getQuantity().compareTo(qty) < 0) {
            throw new BusinessException("No se puede anular: esa mercancía ya no está completa en " + place.label()
                    + " (se sacó o se trasladó después). Anule primero los movimientos posteriores o haga un ajuste.");
        }
        takeFrom(stock, qty, weight);
    }

    private void addForVoid(Lot lot, Place place, BigDecimal qty, BigDecimal weight) {
        Stock stock = stockAt(lot, place);
        stock.setQuantity(stock.getQuantity().add(qty));
        if (weight != null) {
            stock.setWeightKg(zeroIfNull(stock.getWeightKg()).add(weight));
        }
    }

    private Movement base(MovementEffect effect, String type, Item item, Lot lot, Quantity q, User user,
                          String reason, String note, String reference, LocalDate date) {
        LocalDate movementDate = date == null ? LocalDate.now() : date;
        if (movementDate.isAfter(LocalDate.now())) {
            throw new BusinessException("La fecha del movimiento no puede ser futura.");
        }
        return Movement.builder()
                .effect(effect)
                .movementType(typeOrDefault(type, effect))
                .item(item)
                .lot(lot)
                .quantity(q.total())
                .unitName(item.getUnitName())
                .containers(q.containers())
                .containerName(q.containerName())
                .unitsPerContainer(q.unitsPerContainer())
                .weightKg(q.weightKg())
                .reason(clean(reason))
                .note(clean(note))
                .reference(clean(reference))
                .movementDate(movementDate)
                .createdBy(user)
                .build();
    }

    /** Total escrito, o contenedores × unidades por contenedor. */
    static Quantity resolve(QuantityInput in) {
        if (in == null) {
            throw new BusinessException("Escriba la cantidad.");
        }
        BigDecimal containers = in.containers() == null ? null : scale(in.containers());
        BigDecimal units = in.unitsPerContainer() == null ? null : scale(in.unitsPerContainer());
        BigDecimal total = in.total();
        if (total == null && containers != null && units != null) {
            total = containers.multiply(units);
        }
        if (total == null) {
            throw new BusinessException("Escriba la cantidad: el número total, o cuántos contenedores hay "
                    + "y cuántas unidades trae cada uno.");
        }
        total = scale(total);
        if (total.signum() <= 0) {
            throw new BusinessException("La cantidad debe ser mayor que cero.");
        }
        if (total.compareTo(MAX_QUANTITY) > 0) {
            throw new BusinessException("La cantidad es demasiado grande. Revise el número escrito.");
        }
        return new Quantity(total, containers, clean(in.containerName()), units,
                in.weightKg() == null ? null : scale(in.weightKg()));
    }

    /**
     * @param required en traslados el destino es obligatorio; en entradas se puede
     *                 dejar sin ubicación y se usa la sugerida del módulo
     */
    private Place resolvePlace(LocationInput in, InventoryModule module, boolean required) {
        if (in != null && in.rackId() != null) {
            Rack rack = mapService.requireLocation(in.rackId(), in.level());
            return new Place(rack, in.level(), null);
        }
        String note = in == null ? null : clean(in.note());
        if (note == null && required) {
            throw new BusinessException("Escoja en el mapa a dónde va, o escriba la ubicación.");
        }
        return new Place(null, null, note != null ? note : clean(module.getLocationHint()));
    }

    private static Place placeOf(Stock stock) {
        return new Place(stock.getRack(), stock.getLevel(), stock.getLocationNote());
    }

    private Stock lockStock(Long stockId) {
        return stockRepository.findForUpdate(stockId)
                .orElseThrow(() -> new ResourceNotFoundException("Esa existencia ya no está disponible. Actualice la página."));
    }

    private Optional<Stock> findStock(Lot lot, Place place) {
        return place.rack() != null
                ? stockRepository.findAtRack(lot.getId(), place.rack().getId(), place.level())
                : stockRepository.findAtNote(lot.getId(), place.note());
    }

    /** Existencia del rótulo en la ubicación; la crea en cero si todavía no hay. */
    private Stock stockAt(Lot lot, Place place) {
        return findStock(lot, place).orElseGet(() -> stockRepository.save(Stock.builder()
                .lot(lot)
                .rack(place.rack())
                .level(place.level())
                .locationNote(place.rack() == null ? place.note() : null)
                .quantity(BigDecimal.ZERO.setScale(SCALE))
                .build()));
    }

    private static void requireAvailable(Stock stock, BigDecimal wanted, Item item, Place place) {
        if (wanted.compareTo(stock.getQuantity()) > 0) {
            throw new InsufficientStockException("No hay suficiente " + item.displayName() + " en " + place.label()
                    + ": hay " + fmt(stock.getQuantity()) + " " + item.getUnitName()
                    + " y se quieren mover " + fmt(wanted) + ".");
        }
    }

    /** Peso que sale: el escrito, o la parte proporcional a la cantidad. */
    private static BigDecimal portionWeight(Stock stock, BigDecimal qty, BigDecimal written) {
        if (written != null) {
            if (stock.getWeightKg() != null && written.compareTo(stock.getWeightKg()) > 0) {
                throw new BusinessException("El peso escrito (" + fmt(written) + " kg) es mayor que el registrado ("
                        + fmt(stock.getWeightKg()) + " kg).");
            }
            return written;
        }
        if (stock.getWeightKg() == null) {
            return null;
        }
        if (qty.compareTo(stock.getQuantity()) >= 0) {
            return stock.getWeightKg();
        }
        return stock.getWeightKg().multiply(qty).divide(stock.getQuantity(), SCALE, RoundingMode.HALF_UP);
    }

    private void takeFrom(Stock stock, BigDecimal qty, BigDecimal weight) {
        stock.setQuantity(stock.getQuantity().subtract(qty));
        if (weight != null && stock.getWeightKg() != null) {
            stock.setWeightKg(stock.getWeightKg().subtract(weight).max(BigDecimal.ZERO));
        }
        removeIfEmpty(stock);
    }

    /** Una ubicación que queda en cero se quita; el historial queda en los movimientos. */
    private void removeIfEmpty(Stock stock) {
        if (stock.getQuantity().signum() == 0) {
            stockRepository.delete(stock);
        }
    }

    private static void setFrom(Movement m, Place p) {
        m.setFromRack(p.rack());
        m.setFromLevel(p.level());
        m.setFromNote(p.rack() == null ? p.note() : null);
    }

    private static void setTo(Movement m, Place p) {
        m.setToRack(p.rack());
        m.setToLevel(p.level());
        m.setToNote(p.rack() == null ? p.note() : null);
    }

    private static String typeOrDefault(String type, MovementEffect effect) {
        String value = clean(type);
        if (value != null) {
            return value;
        }
        return switch (effect) {
            case ENTRADA -> "Entrada";
            case SALIDA -> "Salida";
            case TRASLADO -> "Traslado";
            case AJUSTE -> "Ajuste de inventario";
        };
    }

    private static String withCount(String note, BigDecimal before, BigDecimal counted, String unit) {
        String count = "Registrado: " + fmt(before) + " " + unit + " · contado: " + fmt(counted) + " " + unit + ".";
        String value = clean(note);
        String full = value == null ? count : value + " (" + count + ")";
        return full.length() > 500 ? full.substring(0, 500) : full;
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    static String fmt(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
