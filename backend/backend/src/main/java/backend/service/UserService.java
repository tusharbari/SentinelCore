package backend.service;

import backend.entity.Role;
import backend.entity.User;
import backend.repository.RoleRepository;
import backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ================= Get All Users =================

    public List<User> getAllUsers() {

        return userRepository.findAll();

    }

    // ================= Get User By ID =================

    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User Not Found"));

    }

    // ================= Add User =================

    public User addUser(User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Encrypt Password
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // Load Role
        Role role = roleRepository.findById(user.getRole().getId())
                .orElseThrow(() ->
                        new RuntimeException("Role not found"));

        user.setRole(role);

        // Enable user by default
        user.setEnabled(true);

        return userRepository.save(user);

    }

    // ================= Update User =================

    public User updateUser(Long id, User updatedUser) {

        User user = getUserById(id);

        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());

        // Update Password only if entered
        if (updatedUser.getPassword() != null &&
                !updatedUser.getPassword().isBlank()) {

            user.setPassword(
                    passwordEncoder.encode(updatedUser.getPassword())
            );

        }

        // Update Role
        Role role = roleRepository.findById(updatedUser.getRole().getId())
                .orElseThrow(() ->
                        new RuntimeException("Role not found"));

        user.setRole(role);

        // Update Status
        user.setEnabled(updatedUser.getEnabled());

        return userRepository.save(user);

    }

    // ================= Delete User =================

    public void deleteUser(Long id) {

        User user = getUserById(id);

        userRepository.delete(user);

    }

}