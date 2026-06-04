import * as bookmarkService from './bookmark.service.js';

export const createBookmark = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookmark = await bookmarkService.createBookmark(userId, req.body);
        res.status(201).json({ message: "Bookmark added successfully", bookmark });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getBookmarks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const bookmarks = await bookmarkService.getUserBookmarks(userId);
        res.status(200).json(bookmarks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateBookmark = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const userId = req.user.userId;

        const bookmark = await bookmarkService.updateBookmark(userId, id, note);
        res.status(200).json({ message: "Bookmark updated successfully", bookmark });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const deleteBookmark = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await bookmarkService.deleteBookmark(userId, id);
        res.status(200).json({ message: "Bookmark deleted successfully" });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};
