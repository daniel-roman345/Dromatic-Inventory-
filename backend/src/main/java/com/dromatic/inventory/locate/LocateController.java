package com.dromatic.inventory.locate;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LocateController {

    private final LocateService locateService;

    /** "¿Dónde está?": mínimo 2 letras. */
    @GetMapping("/api/locate")
    public List<LocateResult> search(@RequestParam String q, @RequestParam(required = false) String module) {
        return locateService.search(q, module);
    }
}
