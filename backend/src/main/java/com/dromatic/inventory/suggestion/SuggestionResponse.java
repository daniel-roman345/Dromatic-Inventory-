package com.dromatic.inventory.suggestion;

public record SuggestionResponse(Long id, SuggestionKind kind, Long moduleId, String moduleName, String value) {

    public static SuggestionResponse from(Suggestion s) {
        return new SuggestionResponse(s.getId(), s.getKind(),
                s.getModule() == null ? null : s.getModule().getId(),
                s.getModule() == null ? null : s.getModule().getName(), s.getValue());
    }
}
