package com.dromatic.inventory.alert;

import com.dromatic.inventory.common.event.StockChangedEvent;
import com.dromatic.inventory.item.Item;
import com.dromatic.inventory.item.ItemQueryService;
import com.dromatic.inventory.item.ItemRepository;
import com.dromatic.inventory.lot.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Revisa el mínimo cada vez que cambia la cantidad de un artículo, después de
 * guardar el movimiento. Si algo falla aquí, el movimiento ya quedó registrado.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AlertEvaluator {

    private final StockAlertRepository alertRepository;
    private final ItemRepository itemRepository;
    private final StockRepository stockRepository;
    private final ApplicationEventPublisher events;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onStockChanged(StockChangedEvent event) {
        try {
            evaluate(event.itemId());
        } catch (RuntimeException e) {
            log.error("No se pudo revisar la alerta del artículo {}", event.itemId(), e);
        }
    }

    void evaluate(Long itemId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) {
            return;
        }
        BigDecimal total = stockRepository.totalByItem(itemId);
        boolean low = Item.ACTIVO.equals(item.getStatus()) && ItemQueryService.isLow(total, item.getMinimumStock());
        Optional<StockAlert> open = alertRepository.findFirstByItemIdAndStatus(itemId, StockAlert.ABIERTA);

        if (low && open.isEmpty()) {
            StockAlert alert = alertRepository.save(StockAlert.builder()
                    .item(item)
                    .quantity(total)
                    .minimumStock(item.getMinimumStock())
                    .build());
            events.publishEvent(new AlertOpenedEvent(alert.getId()));
        } else if (!low && open.isPresent()) {
            StockAlert alert = open.get();
            alert.setStatus(StockAlert.CERRADA);
            alert.setClosedAt(LocalDateTime.now());
            alert.setClosedReason(closeReason(item, total, alert));
        }
    }

    private static String closeReason(Item item, BigDecimal total, StockAlert alert) {
        if (!Item.ACTIVO.equals(item.getStatus())) {
            return "El artículo se marcó como inactivo";
        }
        if (item.getMinimumStock().signum() == 0) {
            return "Se quitó el mínimo del artículo";
        }
        if (total.compareTo(alert.getMinimumStock()) <= 0) {
            return "Se cambió el mínimo del artículo";
        }
        return "Se repuso el inventario";
    }
}
