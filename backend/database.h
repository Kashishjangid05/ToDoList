#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <vector>
#include <map>
#include <memory>
#include <fstream>
#include <iostream>
#include <chrono>
#include <random>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <filesystem>
#include "json.hpp"
#include "models.h"

using json = nlohmann::json;

class Database {
private:
    std::string dbPath = "./data/";
    std::vector<User> users;
    std::vector<Task> tasks;
    std::vector<Category> categories;
    std::vector<Token> tokens;
    
    // Helper methods
    void saveUsers() {
        json usersJson = json::array();
        for (const auto& user : users) {
            usersJson.push_back({
                {"id", user.id},
                {"name", user.name},
                {"email", user.email},
                {"password", user.password}
            });
        }
        
        std::ofstream file(dbPath + "users.json");
        file << usersJson.dump(4);
    }
    
    void saveTasks() {
        json tasksJson = json::array();
        for (const auto& task : tasks) {
            tasksJson.push_back({
                {"id", task.id},
                {"title", task.title},
                {"description", task.description},
                {"dueDate", task.dueDate},
                {"priority", task.priority},
                {"category", task.category},
                {"completed", task.completed},
                {"createdAt", task.createdAt},
                {"userId", task.userId}
            });
        }
        
        std::ofstream file(dbPath + "tasks.json");
        file << tasksJson.dump(4);
    }
    
    void saveCategories() {
        json categoriesJson = json::array();
        for (const auto& category : categories) {
            categoriesJson.push_back({
                {"id", category.id},
                {"name", category.name},
                {"icon", category.icon},
                {"userId", category.userId}
            });
        }
        
        std::ofstream file(dbPath + "categories.json");
        file << categoriesJson.dump(4);
    }
    
    void saveTokens() {
        json tokensJson = json::array();
        for (const auto& token : tokens) {
            tokensJson.push_back({
                {"token", token.token},
                {"userId", token.userId},
                {"expiresAt", token.expiresAt}
            });
        }
        
        std::ofstream file(dbPath + "tokens.json");
        file << tokensJson.dump(4);
    }
    
    void loadUsers() {
        try {
            std::ifstream file(dbPath + "users.json");
            if (file.is_open()) {
                json usersJson = json::parse(file);
                users.clear();
                
                for (const auto& userJson : usersJson) {
                    User user;
                    user.id = userJson["id"];
                    user.name = userJson["name"];
                    user.email = userJson["email"];
                    user.password = userJson["password"];
                    users.push_back(user);
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Error loading users: " << e.what() << std::endl;
        }
    }
    
    void loadTasks() {
        try {
            std::ifstream file(dbPath + "tasks.json");
            if (file.is_open()) {
                json tasksJson = json::parse(file);
                tasks.clear();
                
                for (const auto& taskJson : tasksJson) {
                    Task task;
                    task.id = taskJson["id"];
                    task.title = taskJson["title"];
                    task.description = taskJson["description"];
                    task.dueDate = taskJson["dueDate"];
                    task.priority = taskJson["priority"];
                    task.category = taskJson["category"];
                    task.completed = taskJson["completed"];
                    task.createdAt = taskJson["createdAt"];
                    task.userId = taskJson["userId"];
                    tasks.push_back(task);
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Error loading tasks: " << e.what() << std::endl;
        }
    }
    
    void loadCategories() {
        try {
            std::ifstream file(dbPath + "categories.json");
            if (file.is_open()) {
                json categoriesJson = json::parse(file);
                categories.clear();
                
                for (const auto& categoryJson : categoriesJson) {
                    Category category;
                    category.id = categoryJson["id"];
                    category.name = categoryJson["name"];
                    category.icon = categoryJson["icon"];
                    category.userId = categoryJson["userId"];
                    categories.push_back(category);
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Error loading categories: " << e.what() << std::endl;
        }
    }
    
    void loadTokens() {
        try {
            std::ifstream file(dbPath + "tokens.json");
            if (file.is_open()) {
                json tokensJson = json::parse(file);
                tokens.clear();
                
                for (const auto& tokenJson : tokensJson) {
                    Token token;
                    token.token = tokenJson["token"];
                    token.userId = tokenJson["userId"];
                    token.expiresAt = tokenJson["expiresAt"];
                    tokens.push_back(token);
                }
            }
        } catch (const std::exception& e) {
            std::cerr << "Error loading tokens: " << e.what() << std::endl;
        }
    }
    
    std::string generateRandomString(size_t length) {
        const std::string chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        std::random_device rd;
        std::mt19937 generator(rd());
        std::uniform_int_distribution<> distribution(0, chars.size() - 1);
        
        std::string randomString;
        for (size_t i = 0; i < length; ++i) {
            randomString += chars[distribution(generator)];
        }
        
        return randomString;
    }
    
    std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto now_c = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&now_c), "%Y-%m-%dT%H:%M:%S");
        return ss.str();
    }
    
    std::string getExpirationTimestamp() {
        auto now = std::chrono::system_clock::now() + std::chrono::hours(24); // Token expires in 24 hours
        auto now_c = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&now_c), "%Y-%m-%dT%H:%M:%S");
        return ss.str();
    }
    
    bool isTokenExpired(const std::string& expiresAt) {
        auto now = std::chrono::system_clock::now();
        auto now_c = std::chrono::system_clock::to_time_t(now);
        std::tm now_tm = *std::localtime(&now_c);
        
        std::tm expires_tm = {};
        std::istringstream ss(expiresAt);
        ss >> std::get_time(&expires_tm, "%Y-%m-%dT%H:%M:%S");
        
        auto expires_time_t = std::mktime(&expires_tm);
        
        return now_c > expires_time_t;
    }
    
public:
    void init() {
        // Create data directory if it doesn't exist (portable C++17)
        try {
            std::filesystem::create_directories(dbPath);
        } catch (const std::exception& e) {
            std::cerr << "Failed to create data directory '" << dbPath << "': " << e.what() << std::endl;
        }

        // Load data from files
        loadUsers();
        loadTasks();
        loadCategories();
        loadTokens();
        
        // Add default categories if none exist
        if (categories.empty()) {
            Category work;
            work.id = "work";
            work.name = "Work";
            work.icon = "fas fa-briefcase";
            work.userId = "default";
            categories.push_back(work);
            
            Category personal;
            personal.id = "personal";
            personal.name = "Personal";
            personal.icon = "fas fa-user";
            personal.userId = "default";
            categories.push_back(personal);
            
            Category urgent;
            urgent.id = "urgent";
            urgent.name = "Urgent";
            urgent.icon = "fas fa-exclamation-circle";
            urgent.userId = "default";
            categories.push_back(urgent);
            
            saveCategories();
        }
    }
    
    // User methods
    void createUser(const User& user) {
        users.push_back(user);
        saveUsers();
    }
    
    std::shared_ptr<User> getUserById(const std::string& id) {
        for (const auto& user : users) {
            if (user.id == id) {
                return std::make_shared<User>(user);
            }
        }
        return nullptr;
    }
    
    std::shared_ptr<User> getUserByEmail(const std::string& email) {
        for (const auto& user : users) {
            if (user.email == email) {
                return std::make_shared<User>(user);
            }
        }
        return nullptr;
    }
    
    // Task methods
    void createTask(const Task& task) {
        tasks.push_back(task);
        saveTasks();
    }
    
    void updateTask(const Task& task) {
        for (auto& t : tasks) {
            if (t.id == task.id) {
                t = task;
                break;
            }
        }
        saveTasks();
    }
    
    void deleteTask(const std::string& id) {
        tasks.erase(std::remove_if(tasks.begin(), tasks.end(), 
            [&](const Task& task) { return task.id == id; }), tasks.end());
        saveTasks();
    }
    
    std::shared_ptr<Task> getTaskById(const std::string& id) {
        for (const auto& task : tasks) {
            if (task.id == id) {
                return std::make_shared<Task>(task);
            }
        }
        return nullptr;
    }
    
    std::vector<Task> getTasksByUserId(const std::string& userId) {
        std::vector<Task> userTasks;
        for (const auto& task : tasks) {
            if (task.userId == userId) {
                userTasks.push_back(task);
            }
        }
        return userTasks;
    }
    
    // Category methods
    void createCategory(const Category& category) {
        categories.push_back(category);
        saveCategories();
    }
    
    std::vector<Category> getCategoriesByUserId(const std::string& userId) {
        std::vector<Category> userCategories;
        for (const auto& category : categories) {
            if (category.userId == userId || category.userId == "default") {
                userCategories.push_back(category);
            }
        }
        return userCategories;
    }
    
    // Token methods
    std::string generateToken(const std::string& userId) {
        // Remove expired tokens
        tokens.erase(std::remove_if(tokens.begin(), tokens.end(), 
            [&](const Token& token) { return isTokenExpired(token.expiresAt); }), tokens.end());
        
        // Remove existing tokens for user
        tokens.erase(std::remove_if(tokens.begin(), tokens.end(), 
            [&](const Token& token) { return token.userId == userId; }), tokens.end());
        
        // Generate new token
        Token token;
        token.token = generateRandomString(64);
        token.userId = userId;
        token.expiresAt = getExpirationTimestamp();
        
        tokens.push_back(token);
        saveTokens();
        
        return token.token;
    }
    
    bool verifyToken(const std::string& tokenStr) {
        for (const auto& token : tokens) {
            if (token.token == tokenStr) {
                if (!isTokenExpired(token.expiresAt)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    std::string getUserIdFromToken(const std::string& tokenStr) {
        for (const auto& token : tokens) {
            if (token.token == tokenStr) {
                if (!isTokenExpired(token.expiresAt)) {
                    return token.userId;
                }
            }
        }
        return "";
    }
    
    void removeToken(const std::string& tokenStr) {
        tokens.erase(std::remove_if(tokens.begin(), tokens.end(), 
            [&](const Token& token) { return token.token == tokenStr; }), tokens.end());
        saveTokens();
    }
};

#endif // DATABASE_H