package com.peopleground.sagwim.place.application;

import com.peopleground.sagwim.place.application.port.PlaceAutocompletePort;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceAutocompletePort placeAutocompletePort;

    public List<PlaceSuggestionResponse> searchAutocomplete(String query) {
        String keyword = query == null ? "" : query.trim();
        if (keyword.length() < 2) {
            return List.of();
        }
        return placeAutocompletePort.autocomplete(keyword);
    }
}
