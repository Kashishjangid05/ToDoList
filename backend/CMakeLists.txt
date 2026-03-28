cmake_minimum_required(VERSION 3.10)
project(TodoListBackend)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)

# Download dependencies
include(FetchContent)

# Download cpp-httplib
FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.11.2
)
FetchContent_MakeAvailable(httplib)
include_directories(${httplib_SOURCE_DIR})

# Download nlohmann/json
FetchContent_Declare(
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git
    GIT_TAG v3.11.2
)
FetchContent_MakeAvailable(json)
include_directories(${json_SOURCE_DIR}/include)

# Create data directory
file(MAKE_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/data)

# Add executable
add_executable(server server.cpp)

# Link libraries
target_link_libraries(server PRIVATE)

# Copy static files to build directory
file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/../index.html DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/..)
file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/../css DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/..)
file(COPY ${CMAKE_CURRENT_SOURCE_DIR}/../js DESTINATION ${CMAKE_CURRENT_BINARY_DIR}/..)

# Windows-specific settings
if(WIN32)
    target_link_libraries(server PRIVATE ws2_32)
    # Fix for Windows path creation
    add_custom_command(
        TARGET server POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory "${CMAKE_CURRENT_BINARY_DIR}/data"
    )
    # Fix mkdir command in database.h for Windows
    add_compile_definitions(WINDOWS_PLATFORM)
endif()