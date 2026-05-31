import * as moduleService from './module.service.js';

export const createModule = async (req, res) => {
  try {
    if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Only instructors can add modules" });
    }

    const userId = req.user.userId;
    const courseId = req.params.courseId || req.body.courseId;
    
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const { title, contentType, body, order, durationS } = req.body;

    if (!title || !contentType || !body) {
      return res.status(400).json({ error: "title, contentType, and body are required" });
    }

    const module = await moduleService.createModule(userId, courseId, req.body);
    res.status(201).json({ message: "Module created successfully", module });
  } catch (error) {
    if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getModules = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const modules = await moduleService.getModulesByCourseId(courseId, req.user);
    res.status(200).json(modules);
  } catch (error) {
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getModule = async (req, res) => {
  try {
    const { id } = req.params;
    const module = await moduleService.getModuleById(id, req.user);
    res.status(200).json(module);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
        return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateModule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const module = await moduleService.updateModule(userId, id, req.body);
    res.status(200).json({ message: "Module updated successfully", module });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    await moduleService.deleteModule(userId, id);
    res.status(200).json({ message: "Module deleted successfully" });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("Unauthorized")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};