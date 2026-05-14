package com.tourismgov.event.config; // Put this in your config or security package

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Enumeration;

@Configuration
public class FeignClientInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate requestTemplate) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            Enumeration<String> headerNames = request.getHeaderNames();
            
            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    
                    // Safely forward headers, ignoring payload-specific ones to prevent Feign errors
                    if (headerName.equalsIgnoreCase("content-length") || 
                        headerName.equalsIgnoreCase("content-type") ||
                        headerName.equalsIgnoreCase("host") ||
                        headerName.equalsIgnoreCase("connection")) {
                        continue;
                    }
                    
                    // Forwards X-User-Id, X-User-Roles, and Authorization headers
                    requestTemplate.header(headerName, request.getHeader(headerName));
                }
            }
        }
    }
}