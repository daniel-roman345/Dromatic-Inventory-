package com.dromatic.inventory.lot;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * Campos del RÓTULO DE IDENTIFICACIÓN, en el mismo orden del papel.
 * Solo la fecha y el tipo de material son obligatorios; el resto se copia si
 * está escrito. Quien registra el cambio se toma de la sesión.
 */
public record LabelRequest(
        @NotNull(message = "Escriba la fecha del rótulo.")
        @PastOrPresent(message = "La fecha del rótulo no puede ser futura.") LocalDate labelDate,
        @NotBlank(message = "Escriba el tipo de material (ej. material de empaque, materia prima).")
        @Size(max = 60) String materialType,
        @Size(max = 50) String lotNumber,
        @Size(max = 40) String declaredQuantity,
        @Size(max = 120) String supplier,
        LocalDate receptionDate,
        LocalDate analysisDate,
        LocalDate reanalysisDate,
        LocalDate expiryDate,
        @Size(max = 40) String analysisNumber,
        @Size(max = 40) String reanalysisNumber,
        @Pattern(regexp = "CUARENTENA|APROBADO|RECHAZADO", message = "El estado debe ser cuarentena, aprobado o rechazado.")
        String qualityStatus,
        @Size(max = 80) String responsible,
        @Size(max = 80) String qcSignature,
        @Min(value = 0, message = "El rombo NFPA va de 0 a 4.") @Max(value = 4, message = "El rombo NFPA va de 0 a 4.")
        Integer nfpaHealth,
        @Min(value = 0, message = "El rombo NFPA va de 0 a 4.") @Max(value = 4, message = "El rombo NFPA va de 0 a 4.")
        Integer nfpaFlammability,
        @Min(value = 0, message = "El rombo NFPA va de 0 a 4.") @Max(value = 4, message = "El rombo NFPA va de 0 a 4.")
        Integer nfpaReactivity,
        @Size(max = 10) String nfpaSpecial,
        @Size(max = 500) String notes) {
}
