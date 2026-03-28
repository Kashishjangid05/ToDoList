#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <ctime>
#include <sstream>
#include <fstream>
#include <algorithm>
#include <memory>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <thread>
#include <mutex>
#include <chrono>
#include "httplib.h"
#include "json.hpp"
#include "database.h"
#include "models.h"

// Namespaces
using json = nlohmann::json;
using namespace httplib;

// Global variables
Database db;
std::mutex dbMutex;

// Helper functions
std::string generateId() {
    return std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
}

std::string getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto now_c = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&now_c), "%Y-%m-%dT%H:%M:%S");
    return ss.str();
}

// CORS middleware
void enableCors(Response &res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// Authentication middleware
bool authenticate(const Request &req, Response &res) {
    // Get token from Authorization header
    auto auth = req.get_header_value("Authorization");
    if (auth.empty() || auth.substr(0, 7) != "Bearer ") {
        res.status = 401;
        json error = {{
            "error", "Unauthorized"
        }};
        res.set_content(error.dump(), "application/json");
        return false;
    }
    
    std::string token = auth.substr(7);
    
    // Verify token
    std::lock_guard<std::mutex> lock(dbMutex);
    if (!db.verifyToken(token)) {
        res.status = 401;
        json error = {{
            "error", "Invalid token"
        }};
        res.set_content(error.dump(), "application/json");
        return false;
    }
    
    return true;
}

int main() {
    // Initialize database
    db.init();
    
    // Create server
    Server server;
    
    // Set up CORS for all routes
    server.set_exception_handler([](const Request& req, Response& res, std::exception_ptr ep) {
        enableCors(res);
        try {
            std::rethrow_exception(ep);
        } catch (std::exception& e) {
            res.status = 500;
            res.set_content(e.what(), "text/plain");
        } catch (...) {
            res.status = 500;
            res.set_content("Unknown exception", "text/plain");
        }
    });
    
    // Handle OPTIONS requests for CORS preflight
    server.Options(".*", [](const Request& req, Response& res) {
        enableCors(res);
        res.status = 200;
    });
    
    // Serve static files
    server.set_mount_point("/", "../");
    
    // Authentication routes
    server.Post("/api/auth/register", [](const Request& req, Response& res) {
        enableCors(res);
        
        // Parse request body
        json data = json::parse(req.body);
        
        // Validate required fields
        if (data["name"].empty() || data["email"].empty() || data["password"].empty()) {
            res.status = 400;
            json error = {{
                "error", "Missing required fields"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Create user
        User user;
        user.id = generateId();
        user.name = data["name"];
        user.email = data["email"];
        user.password = data["password"]; // In a real app, this should be hashed
        
        // Save user to database
        std::lock_guard<std::mutex> lock(dbMutex);
        if (db.getUserByEmail(user.email)) {
            res.status = 400;
            json error = {{
                "error", "Email already exists"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        db.createUser(user);
        
        // Generate token
        std::string token = db.generateToken(user.id);
        
        // Return user data and token
        json response = {
            {"user", {
                {"id", user.id},
                {"name", user.name},
                {"email", user.email}
            }},
            {"token", token}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Post("/api/auth/login", [](const Request& req, Response& res) {
        enableCors(res);
        
        // Parse request body
        json data = json::parse(req.body);
        
        // Validate required fields
        if (data["email"].empty() || data["password"].empty()) {
            res.status = 400;
            json error = {{
                "error", "Missing required fields"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Find user by email
        std::lock_guard<std::mutex> lock(dbMutex);
        std::shared_ptr<User> user = db.getUserByEmail(data["email"]);
        
        if (!user || user->password != data["password"]) { // In a real app, passwords should be hashed and compared securely
            res.status = 401;
            json error = {{
                "error", "Invalid credentials"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Generate token
        std::string token = db.generateToken(user->id);
        
        // Return user data and token
        json response = {
            {"user", {
                {"id", user->id},
                {"name", user->name},
                {"email", user->email}
            }},
            {"token", token}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Post("/api/auth/logout", [](const Request& req, Response& res) {
        enableCors(res);
        
        // Get token from Authorization header
        auto auth = req.get_header_value("Authorization");
        if (!auth.empty() && auth.substr(0, 7) == "Bearer ") {
            std::string token = auth.substr(7);
            
            // Remove token
            std::lock_guard<std::mutex> lock(dbMutex);
            db.removeToken(token);
        }
        
        res.status = 200;
        json response = {{
            "success", true
        }};
        res.set_content(response.dump(), "application/json");
    });
    
    // Task routes
    server.Get("/api/tasks", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Get tasks for user
        std::vector<Task> tasks = db.getTasksByUserId(userId);
        
        // Convert tasks to JSON
        json response = json::array();
        for (const auto& task : tasks) {
            response.push_back({
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
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Post("/api/tasks", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Parse request body
        json data = json::parse(req.body);
        
        // Validate required fields
        if (data["title"].empty()) {
            res.status = 400;
            json error = {{
                "error", "Title is required"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Create task
        Task task;
        task.id = generateId();
        task.title = data["title"];
        task.description = data.contains("description") ? data["description"] : "";
        task.dueDate = data.contains("dueDate") ? data["dueDate"] : "";
        task.priority = data.contains("priority") ? data["priority"] : "medium";
        task.category = data.contains("category") ? data["category"] : "";
        task.completed = false;
        task.createdAt = getCurrentTimestamp();
        task.userId = userId;
        
        // Save task to database
        db.createTask(task);
        
        // Return task data
        json response = {
            {"id", task.id},
            {"title", task.title},
            {"description", task.description},
            {"dueDate", task.dueDate},
            {"priority", task.priority},
            {"category", task.category},
            {"completed", task.completed},
            {"createdAt", task.createdAt},
            {"userId", task.userId}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Put("/api/tasks/:id", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Get task ID from URL
        std::string taskId = req.path_params.at("id");
        
        // Parse request body
        json data = json::parse(req.body);
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Get task
        std::shared_ptr<Task> task = db.getTaskById(taskId);
        
        if (!task) {
            res.status = 404;
            json error = {{
                "error", "Task not found"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Check if task belongs to user
        if (task->userId != userId) {
            res.status = 403;
            json error = {{
                "error", "Forbidden"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Update task
        if (data.contains("title")) task->title = data["title"];
        if (data.contains("description")) task->description = data["description"];
        if (data.contains("dueDate")) task->dueDate = data["dueDate"];
        if (data.contains("priority")) task->priority = data["priority"];
        if (data.contains("category")) task->category = data["category"];
        if (data.contains("completed")) task->completed = data["completed"];
        
        // Save task to database
        db.updateTask(*task);
        
        // Return task data
        json response = {
            {"id", task->id},
            {"title", task->title},
            {"description", task->description},
            {"dueDate", task->dueDate},
            {"priority", task->priority},
            {"category", task->category},
            {"completed", task->completed},
            {"createdAt", task->createdAt},
            {"userId", task->userId}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Delete("/api/tasks/:id", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Get task ID from URL
        std::string taskId = req.path_params.at("id");
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Get task
        std::shared_ptr<Task> task = db.getTaskById(taskId);
        
        if (!task) {
            res.status = 404;
            json error = {{
                "error", "Task not found"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Check if task belongs to user
        if (task->userId != userId) {
            res.status = 403;
            json error = {{
                "error", "Forbidden"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Delete task
        db.deleteTask(taskId);
        
        // Return success
        json response = {{
            "success", true
        }};
        
        res.set_content(response.dump(), "application/json");
    });
    
    // Category routes
    server.Get("/api/categories", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Get categories for user
        std::vector<Category> categories = db.getCategoriesByUserId(userId);
        
        // Convert categories to JSON
        json response = json::array();
        for (const auto& category : categories) {
            response.push_back({
                {"id", category.id},
                {"name", category.name},
                {"icon", category.icon},
                {"userId", category.userId}
            });
        }
        
        res.set_content(response.dump(), "application/json");
    });
    
    server.Post("/api/categories", [](const Request& req, Response& res) {
        enableCors(res);
        
        if (!authenticate(req, res)) {
            return;
        }
        
        // Parse request body
        json data = json::parse(req.body);
        
        // Validate required fields
        if (data["name"].empty()) {
            res.status = 400;
            json error = {{
                "error", "Name is required"
            }};
            res.set_content(error.dump(), "application/json");
            return;
        }
        
        // Get user ID from token
        auto auth = req.get_header_value("Authorization");
        std::string token = auth.substr(7);
        
        std::lock_guard<std::mutex> lock(dbMutex);
        std::string userId = db.getUserIdFromToken(token);
        
        // Create category
        Category category;
        category.id = data.contains("id") ? data["id"] : data["name"];
        category.name = data["name"];
        category.icon = data.contains("icon") ? data["icon"] : "fas fa-folder";
        category.userId = userId;
        
        // Save category to database
        db.createCategory(category);
        
        // Return category data
        json response = {
            {"id", category.id},
            {"name", category.name},
            {"icon", category.icon},
            {"userId", category.userId}
        };
        
        res.set_content(response.dump(), "application/json");
    });
    
    // Start server
    std::cout << "Server started at http://localhost:8080" << std::endl;
    server.listen("localhost", 8080);
    
    return 0;
}