package com.peopleground.sagwim.global.dto;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean hasNext
) {
    public static <T, S extends T> PageResponse<T> from(Page<S> page) {
        return new PageResponse<>(
            new ArrayList<>(page.getContent()),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages(),
            page.hasNext()
        );
    }
}
