import type { Express } from "express";
import { isAuthenticated } from "../auth";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import { storage } from "../storage";

export function registerObjectStorageRoutes(app: Express) {
  // Object storage routes for photo upload
app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
  try {
    console.log('Getting upload URL for user:', req.user?.claims?.sub);
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    console.log('Generated upload URL:', uploadURL);
    res.json({ uploadURL });
  } catch (error) {
    console.error('Error getting upload URL:', error);
    res.status(500).json({ message: 'Failed to get upload URL', error: error.message });
  }
});

app.put('/api/profile-image', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { profileImageUrl } = req.body;
    
    if (!profileImageUrl) {
      return res.status(400).json({ message: 'Profile image URL is required' });
    }

    const objectStorageService = new ObjectStorageService();
    const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
      profileImageUrl,
      {
        owner: userId,
        visibility: "public",
      },
    );

    // Update user profile with new image URL
    await storage.updateUserProfileImage(userId, objectPath);
    
    res.json({ message: 'Profile image updated successfully', objectPath });
  } catch (error) {
    console.error('Error updating profile image:', error);
    res.status(500).json({ message: 'Failed to update profile image' });
  }
});

app.put('/api/hero-image', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { heroImageUrl } = req.body;
    
    console.log('Updating hero image for user:', userId, 'with URL:', heroImageUrl);
    
    if (!heroImageUrl) {
      return res.status(400).json({ message: 'Hero image URL is required' });
    }

    const objectStorageService = new ObjectStorageService();
    const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
      heroImageUrl,
      {
        owner: userId,
        visibility: "public",
      },
    );

    console.log('Object path after ACL policy:', objectPath);

    // Update user profile with new hero image URL
    await storage.updateUserHeroImage(userId, objectPath);
    
    console.log('Hero image updated successfully in database');
    res.json({ message: 'Hero image updated successfully', objectPath });
  } catch (error) {
    console.error('Error updating hero image:', error);
    res.status(500).json({ message: 'Failed to update hero image', error: error.message });
  }
});

app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
  const userId = req.user?.claims?.sub;
  const objectStorageService = new ObjectStorageService();
  try {
    const objectFile = await objectStorageService.getObjectEntityFile(
      req.path,
    );
    const canAccess = await objectStorageService.canAccessObjectEntity({
      objectFile,
      userId: userId,
      requestedPermission: "READ" as any,
    });
    if (!canAccess) {
      return res.sendStatus(401);
    }
    objectStorageService.downloadObject(objectFile, res);
  } catch (error) {
    console.error("Error checking object access:", error);
    if (error instanceof ObjectNotFoundError) {
      return res.sendStatus(404);
    }
    return res.sendStatus(500);
  }
});

}
