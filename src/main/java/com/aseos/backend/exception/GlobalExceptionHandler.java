package com.aseos.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException exc) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        errorDetails.put("error", "Payload Too Large");
        errorDetails.put("message", "File size exceeds the allowable limit (maximum 50MB). Please select a smaller image.");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(errorDetails);
    }
}
