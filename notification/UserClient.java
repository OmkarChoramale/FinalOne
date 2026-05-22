package com.tourismgov.notification.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.tourismgov.notification.dto.UserDTO;

@FeignClient(name = "USER-SERVICE", fallback = UserClientFallback.class)
public interface UserClient {

    @GetMapping("/tourismgov/v1/users/internal/{id}")
    UserDTO getUserById(@PathVariable("id") Long id);

    @GetMapping("/tourismgov/v1/users/internal/all")
    List<UserDTO> getAllUsers();
}