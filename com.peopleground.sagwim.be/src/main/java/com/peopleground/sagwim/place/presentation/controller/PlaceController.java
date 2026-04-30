package com.peopleground.sagwim.place.presentation.controller;

import com.peopleground.sagwim.place.application.PlaceService;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/places")
public class PlaceController {

    private final PlaceService placeService;

    @GetMapping("/autocomplete")
    public ResponseEntity<List<PlaceSuggestionResponse>> autocomplete(
        @RequestParam String query
    ) {
        List<PlaceSuggestionResponse> response = placeService.searchAutocomplete(query);
        return ResponseEntity.ok(response);
    }
}
