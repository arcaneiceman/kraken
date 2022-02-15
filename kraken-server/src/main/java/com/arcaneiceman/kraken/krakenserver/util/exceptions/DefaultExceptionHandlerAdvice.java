package com.arcaneiceman.kraken.krakenserver.util.exceptions;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Objects;

@ControllerAdvice
public class DefaultExceptionHandlerAdvice {

    private static final Logger log = LoggerFactory.getLogger(DefaultExceptionHandlerAdvice.class);

    @ExceptionHandler(SystemException.class)
    public ResponseEntity<ExceptionDTO> handleException(SystemException e) {
        log.error("Error Code {}, Error Message : {}", e.getErrorCode(), e.getMessage());
        return new ResponseEntity<>(new ExceptionDTO(e.getErrorCode(), e.getMessage()),
                HttpStatus.valueOf(Objects.requireNonNull(e.getStatus()).getStatusCode()));
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private class ExceptionDTO {
        private int code;
        private String message;
    }
}
