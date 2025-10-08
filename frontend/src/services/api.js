const API_BASE_URL = 'https://mokhothu.onrender.com/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ==================== ENROLLMENT ENDPOINTS ====================
    
    // Enroll a student in a course and class
    async enrollStudent(enrollmentData) {
        return this.request('/enrollment/enroll', {
            method: 'POST',
            body: enrollmentData,
        });
    }

    // Get all enrollments
    async getEnrollments() {
        return this.request('/enrollment');
    }

    // Get available students for enrollment
    async getAvailableStudents() {
        return this.request('/enrollment/available-students');
    }

    // Get courses for enrollment
    async getCourses() {
        return this.request('/enrollment/courses');
    }

    // Get classes for enrollment  
    async getClasses() {
        return this.request('/enrollment/classes');
    }

    // Get specific enrollment by ID
    async getEnrollmentById(id) {
        return this.request(`/enrollment/${id}`);
    }

    // Update enrollment status
    async updateEnrollmentStatus(enrollmentId, status) {
        return this.request(`/enrollment/${enrollmentId}/status`, {
            method: 'PUT',
            body: { status }
        });
    }

    // Delete enrollment
    async deleteEnrollment(enrollmentId) {
        return this.request(`/enrollment/${enrollmentId}`, {
            method: 'DELETE',
        });
    }

    // ==================== AUTH ENDPOINTS ====================
    
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: userData,
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: credentials,
        });
    }

    // ==================== REPORT ENDPOINTS ====================
    
    async getReports() {
        return this.request('/reports');
    }

    async getMyReports() {
        return this.request('/reports/my-reports');
    }

    async getReportsForReview() {
        return this.request('/reports/for-review');
    }

    async getMyReportRatings() {
        return this.request('/reports/my-ratings');
    }

    async createReport(reportData) {
        return this.request('/reports', {
            method: 'POST',
            body: reportData,
        });
    }

    async getReportById(id) {
        return this.request(`/reports/${id}`);
    }

    async updateReport(id, reportData) {
        return this.request(`/reports/${id}`, {
            method: 'PUT',
            body: reportData,
        });
    }

    async rateReport(id, ratingData) {
        return this.request(`/reports/${id}/rate`, {
            method: 'POST',
            body: ratingData,
        });
    }

    async getReportRatings(id) {
        return this.request(`/reports/${id}/ratings`);
    }

    // Report approval endpoints
    async approveReport(id, approvalData = {}) {
        return this.request(`/reports/${id}/approve`, {
            method: 'POST',
            body: approvalData,
        });
    }

    async forwardReport(id, forwardData = {}) {
        return this.request(`/reports/${id}/forward`, {
            method: 'POST',
            body: forwardData,
        });
    }

    async rejectReport(id, rejectionData = {}) {
        return this.request(`/reports/${id}/reject`, {
            method: 'POST',
            body: rejectionData,
        });
    }

    // ==================== USER ENDPOINTS ====================
    
    async getProfile() {
        return this.request('/users/profile');
    }

    async getAllUsers() {
        return this.request('/users');
    }

    // ==================== COURSE ENDPOINTS ====================
    
    async getAllCourses() {
        return this.request('/courses');
    }

    async createCourse(courseData) {
        return this.request('/courses', {
            method: 'POST',
            body: courseData,
        });
    }

    async updateCourse(id, courseData) {
        return this.request(`/courses/${id}`, {
            method: 'PUT',
            body: courseData,
        });
    }

    async deleteCourse(id) {
        return this.request(`/courses/${id}`, {
            method: 'DELETE',
        });
    }

    async assignLecturer(courseId, assignmentData) {
        return this.request(`/courses/${courseId}/assign`, {
            method: 'POST',
            body: assignmentData,
        });
    }

    async removeAssignment(assignmentId) {
        return this.request(`/courses/assignments/${assignmentId}`, {
            method: 'DELETE',
        });
    }

    // ==================== CLASS ENDPOINTS ====================
    
    async getAllClasses() {
        return this.request('/classes');
    }

    async getMyClasses() {
        return this.request('/classes/my-classes');
    }

    async createClass(classData) {
        return this.request('/classes', {
            method: 'POST',
            body: classData,
        });
    }

    async updateClass(id, classData) {
        return this.request(`/classes/${id}`, {
            method: 'PUT',
            body: classData,
        });
    }

    async deleteClass(id) {
        return this.request(`/classes/${id}`, {
            method: 'DELETE',
        });
    }

    async getClassEnrollments(classId) {
        return this.request(`/classes/${classId}/enrollments`);
    }

    async enrollStudentInClass(classId, enrollmentData) {
        return this.request(`/classes/${classId}/enroll`, {
            method: 'POST',
            body: enrollmentData,
        });
    }

    async removeEnrollment(enrollmentId) {
        return this.request(`/classes/enrollments/${enrollmentId}`, {
            method: 'DELETE',
        });
    }

    async getAvailableStudentsForClass(classId) {
        return this.request(`/classes/${classId}/available-students`);
    }

    async getClassLectures(classId) {
        return this.request(`/classes/${classId}/lectures`);
    }

    // ==================== DASHBOARD & UTILITY ENDPOINTS ====================
    
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    // Excel export
    async exportReportsToExcel() {
        const url = `${API_BASE_URL}/reports/export/excel`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('Excel export failed:', error);
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Database test
    async testDatabase() {
        return this.request('/test-db');
    }
}

export default new ApiService();