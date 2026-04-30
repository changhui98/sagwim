package com.peopleground.sagwim.place.infrastructure;

import com.peopleground.sagwim.global.exception.ApiErrorCode;
import com.peopleground.sagwim.global.exception.AppException;
import com.peopleground.sagwim.place.application.port.PlaceAutocompletePort;
import com.peopleground.sagwim.place.infrastructure.dto.GooglePlacesAutocompleteResponse;
import com.peopleground.sagwim.place.infrastructure.dto.GooglePlacesAutocompleteResponse.Suggestion;
import com.peopleground.sagwim.place.presentation.dto.response.PlaceSuggestionResponse;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
public class GooglePlaceClient implements PlaceAutocompletePort {

    @Value("${google.maps.api-key}")
    private String apiKey;

    /**
     * Google Places API (New) 엔드포인트.
     * 구버전(/maps/api/place/autocomplete/json)은 Legacy 상태로 신규 API 키에서 502 에러 발생.
     */
    private final WebClient webClient = WebClient.create("https://places.googleapis.com");

    @Override
    public List<PlaceSuggestionResponse> autocomplete(String query) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("[GooglePlaces] GOOGLE_MAPS_API_KEY is blank. query={}", query);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }

        Map<String, Object> requestBody = Map.of(
            "input", query,
            "languageCode", "ko",
            "includedRegionCodes", List.of("kr")
        );

        GooglePlacesAutocompleteResponse response;
        try {
            response = webClient.post()
                .uri("/v1/places:autocomplete")
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask",
                    "suggestions.placePrediction.placeId,"
                    + "suggestions.placePrediction.text,"
                    + "suggestions.placePrediction.structuredFormat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(GooglePlacesAutocompleteResponse.class)
                .block();
        } catch (WebClientResponseException e) {
            log.error("[GooglePlaces] API HTTP error. status={}, body={}, query={}",
                e.getStatusCode(), e.getResponseBodyAsString(), query);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        } catch (Exception e) {
            log.error("[GooglePlaces] API call failed. query={}", query, e);
            throw new AppException(ApiErrorCode.EXTERNAL_API_ERROR);
        }

        if (response == null || response.suggestions() == null) {
            return List.of();
        }

        return response.suggestions().stream()
            .filter(s -> s.placePrediction() != null)
            .map(this::toSuggestion)
            .toList();
    }

    private PlaceSuggestionResponse toSuggestion(Suggestion suggestion) {
        GooglePlacesAutocompleteResponse.PlacePrediction prediction = suggestion.placePrediction();
        GooglePlacesAutocompleteResponse.StructuredFormat structuredFormat = prediction.structuredFormat();

        String primaryText = structuredFormat != null && structuredFormat.mainText() != null
            ? structuredFormat.mainText().text()
            : (prediction.text() != null ? prediction.text().text() : "");

        String secondaryText = structuredFormat != null && structuredFormat.secondaryText() != null
            ? structuredFormat.secondaryText().text()
            : "";

        String fullAddress = prediction.text() != null ? prediction.text().text() : "";

        return new PlaceSuggestionResponse(
            safeString(prediction.placeId()),
            safeString(primaryText),
            safeString(secondaryText),
            safeString(fullAddress)
        );
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }
}
