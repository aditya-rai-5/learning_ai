import * as courseService from './course.service.js';

export const createCourse = async (req, res) => {
  try {
    // Check if the user is an INSTRUCTOR (or ADMIN)
    if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Only instructors are authorized to create courses" });
    }

    const { title, description } = req.body;
    const userId = req.user.userId;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    const course = await courseService.createCourse(userId, req.body);
    res.status(201).json({ message: "Course created successfully", course });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourse = async (req, res) => {
  try {
    const { identifier } = req.params;
    const course = await courseService.getCourseByIdOrSlug(identifier);
    res.status(200).json(course);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const course = await courseService.updateCourse(userId, id, req.body);
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await courseService.deleteCourse(userId, id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    if (error.message.includes("not found") || error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
