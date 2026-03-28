#ifndef MODELS_H
#define MODELS_H

#include <string>
#include <vector>
#include <memory>

// User model
struct User {
    std::string id;
    std::string name;
    std::string email;
    std::string password; // In a real app, this should be hashed
};

// Task model
struct Task {
    std::string id;
    std::string title;
    std::string description;
    std::string dueDate;
    std::string priority; // "low", "medium", "high"
    std::string category;
    bool completed;
    std::string createdAt;
    std::string userId;
};

// Category model
struct Category {
    std::string id;
    std::string name;
    std::string icon;
    std::string userId;
};

// Token model
struct Token {
    std::string token;
    std::string userId;
    std::string expiresAt;
};

#endif // MODELS_H