package com.peopleground.sagwim.place.application.port;

import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;

public interface PlaceAutocompletePort {

    List<PlaceSuggestionResponse> autocomplete(String query);
}
