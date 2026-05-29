import prisma from '../config/db.config.js';

export const addUserSkill = async (userId, skillTag, proficiency) => {
    // Check if the user already has this skill tag
    const existingSkill = await prisma.userSkill.findFirst({
        where: { userId, skillTag },
    });

    if (existingSkill) {
        // If it exists, update the proficiency
        return prisma.userSkill.update({
            where: { id: existingSkill.id },
            data: { proficiency },
        });
    }

    // Otherwise, create a new skill entry
    return prisma.userSkill.create({
        data: {
            userId,
            skillTag,
            proficiency,
        },
    });
};

export const getUserSkills = async (userId) => {
    return prisma.userSkill.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
    });
};

export const removeUserSkill = async (userId, skillIdentifier) => {
  const result = await prisma.userSkill.deleteMany({
    where: { 
      userId: userId,
      OR: [
        { id: skillIdentifier },
        { skillTag: skillIdentifier }
      ]
    },
  });

  if (result.count === 0) {
    throw new Error("Skill not found or you do not have permission to delete it");
  }

  return result;
};
