package com.dromatic.inventory.service;

import com.dromatic.inventory.dto.MovementItemRequest;
import com.dromatic.inventory.dto.MovementRequest;
import com.dromatic.inventory.dto.MovementResponse;
import com.dromatic.inventory.exception.BusinessException;
import com.dromatic.inventory.exception.InsufficientStockException;
import com.dromatic.inventory.model.*;
import com.dromatic.inventory.repository.MovementRepository;
import com.dromatic.inventory.repository.ProductRepository;
import com.dromatic.inventory.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovementServiceTest {

    @Mock
    private MovementRepository movementRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MovementService movementService;

    private Product product;
    private User user;

    @BeforeEach
    void setUp() {
        Location location = Location.builder().id(1L).zone("Zona A").aisle("Pasillo A").shelf("Estante 1").level("Nivel 1").build();
        product = Product.builder().id(1L).code("SH-001").name("Shampoo").quantity(10).minimumStock(2)
                .location(location).entryDate(LocalDate.now()).status(ProductStatus.ACTIVO).build();
        user = User.builder().id(1L).username("operador1").role(Role.builder().name(Role.OPERADOR).build()).build();

        lenient().when(userRepository.findByUsername("operador1")).thenReturn(Optional.of(user));
        lenient().when(productRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(product));
        lenient().when(movementRepository.save(any(Movement.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void entrada_aumentaElStockYRegistraUsuarioYFecha() {
        List<MovementResponse> result = movementService.register(MovementType.ENTRADA,
                request("Compra a proveedor", item(1L, 5)), "operador1");

        assertEquals(15, product.getQuantity());
        assertEquals(1, result.size());
        assertEquals("operador1", result.get(0).getUsername());
        assertEquals(LocalDate.now(), result.get(0).getMovementDate());
        assertEquals("ENTRADA", result.get(0).getType());
    }

    @Test
    void salida_disminuyeElStock() {
        movementService.register(MovementType.SALIDA, request("Despacho / Venta", item(1L, 4)), "operador1");
        assertEquals(6, product.getQuantity());
    }

    @Test
    void salida_mayorAlStock_noPermiteStockNegativo() {
        assertThrows(InsufficientStockException.class, () ->
                movementService.register(MovementType.SALIDA, request("Despacho / Venta", item(1L, 11)), "operador1"));
        assertEquals(10, product.getQuantity());
        verify(movementRepository, never()).save(any());
    }

    @Test
    void productoRepetido_sumaCantidadesAntesDeValidarStock() {
        assertThrows(InsufficientStockException.class, () ->
                movementService.register(MovementType.SALIDA,
                        request("Despacho / Venta", item(1L, 6), item(1L, 6)), "operador1"));
        assertEquals(10, product.getQuantity());
    }

    @Test
    void motivoNoPermitido_esRechazado() {
        assertThrows(BusinessException.class, () ->
                movementService.register(MovementType.SALIDA, request("Regalo", item(1L, 1)), "operador1"));
    }

    @Test
    void fechaFutura_esRechazada() {
        MovementRequest request = request("Compra a proveedor", item(1L, 1));
        request.setMovementDate(LocalDate.now().plusDays(1));
        assertThrows(BusinessException.class, () ->
                movementService.register(MovementType.ENTRADA, request, "operador1"));
    }

    @Test
    void anularSalida_devuelveElStockYConservaElHistorial() {
        Movement exit = Movement.builder().id(7L).product(product).user(user).type(MovementType.SALIDA)
                .quantity(3).movementDate(LocalDate.now()).build();
        when(movementRepository.findById(7L)).thenReturn(Optional.of(exit));

        MovementResponse response = movementService.voidMovement(7L, "Cantidad digitada mal", "operador1");

        assertEquals(13, product.getQuantity());
        assertTrue(response.isVoided());
        assertEquals("operador1", response.getVoidedBy());
        verify(movementRepository, never()).delete(any());
    }

    @Test
    void anularEntrada_sinStockSuficiente_esRechazada() {
        Movement entry = Movement.builder().id(8L).product(product).user(user).type(MovementType.ENTRADA)
                .quantity(20).movementDate(LocalDate.now()).build();
        when(movementRepository.findById(8L)).thenReturn(Optional.of(entry));

        assertThrows(InsufficientStockException.class, () -> movementService.voidMovement(8L, "Error", "operador1"));
        assertEquals(10, product.getQuantity());
        assertFalse(entry.getVoided());
    }

    private static MovementItemRequest item(Long productId, int quantity) {
        MovementItemRequest item = new MovementItemRequest();
        item.setProductId(productId);
        item.setQuantity(quantity);
        return item;
    }

    private static MovementRequest request(String reason, MovementItemRequest... items) {
        MovementRequest request = new MovementRequest();
        request.setReason(reason);
        request.setItems(List.of(items));
        return request;
    }
}
