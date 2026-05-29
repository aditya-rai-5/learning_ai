import * as userSkillService from './user_skill.service.js';

export const addSkill = async (req, res) => {
    try {
        const { skillTag, proficiency } = req.body;
        const userId = req.user.userId;

        if (!skillTag || typeof proficiency !== 'number') {
            return res.status(400).json({ error: "skillTag (string) and proficiency (number) are required" });
        }

        const skill = await userSkillService.addUserSkill(userId, skillTag, proficiency);
        res.status(201).json({ message: "Skill added/updated successfully", skill });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getSkills = async (req, res) => {
    try {
        const userId = req.user.userId;
        const skills = await userSkillService.getUserSkills(userId);
        res.status(200).json(skills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: skillIdentifier } = req.params;

    await userSkillService.removeUserSkill(userId, skillIdentifier);
    res.status(200).json({ message: "Skill removed successfully" });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};
