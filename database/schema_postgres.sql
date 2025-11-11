-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(30) CHECK (role IN ('student', 'lecturer', 'principal_lecturer', 'program_leader')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INT DEFAULT 3,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    course_id INT,
    lecturer_id INT,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    max_students INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Enrollments table
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (student_id, class_id)
);

-- Reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    faculty_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    week_of_reporting VARCHAR(20) NOT NULL,
    date_of_lecture DATE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    lecturer_name VARCHAR(100) NOT NULL,
    actual_students_present INT NOT NULL,
    total_registered_students INT NOT NULL,
    venue VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    topic_taught TEXT NOT NULL,
    learning_outcomes TEXT NOT NULL,
    recommendations TEXT NOT NULL,
    lecturer_id INT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'forwarded', 'rejected')),
    principal_feedback TEXT,
    rating INT,
    average_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Report ratings table
CREATE TABLE report_ratings (
    id SERIAL PRIMARY KEY,
    report_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (report_id, student_id)
);

-- Lectures table
CREATE TABLE lectures (
    id SERIAL PRIMARY KEY,
    class_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    topic VARCHAR(255) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    duration_minutes INT DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course assignments table
CREATE TABLE course_assignments (
    id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (course_id, lecturer_id, module_name)
);
