package com.dromatic.inventory.alert;

import java.util.List;

/**
 * Mensaje listo para WhatsApp.
 *
 * @param recipients un enlace por persona que recibe alertas (abre el chat con el mensaje escrito)
 * @param anyContactUrl enlace sin número: WhatsApp pide escoger el contacto
 */
public record WhatsAppResponse(String headline, String message, List<Recipient> recipients, String anyContactUrl) {

    public record Recipient(String name, String jobTitle, String phone, String url) {
    }
}
