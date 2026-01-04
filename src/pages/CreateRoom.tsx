import { useState, useRef, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext-new';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
// import { useToast } from '@/hooks/use-toast'; // Duplicate import removed
import { X, Users, Lock, Globe, Crown, Camera, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { RoomService } from '@/lib/app-data';
import { useToast } from "@/hooks/use-toast";

const CreateRoom = ({ isPremium = false }: { isPremium?: boolean }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'public' as 'public' | 'private',
    maxMembers: '50',
    image: ''
  });
  const [customCategory, setCustomCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, resendEmailVerification } = useAuth();

  useEffect(() => {
    const currentMax = parseInt(formData.maxMembers);
    if (!isPremium && currentMax > 10000) {
      setFormData(prev => ({ ...prev, maxMembers: '10000' }));
      toast({ title: "Member limit adjusted", description: "Member limit set to 10,000 (maximum for non-premium users).", variant: "default" });
    }
  }, [isPremium, formData.maxMembers, toast]);

  const categories = [
    'general', 'gaming', 'music', 'movies', 'sports', 'technology', 
    'art', 'cooking', 'travel', 'education', 'business', 'other'
  ];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image smaller than 1MB", variant: "destructive" });
      return;
    }
    try {
      toast({ title: "Uploading room logo..." });
      const res = await uploadToCloudinary(file, 'chitz/rooms');
      setFormData(prev => ({ ...prev, image: res.url }));
      toast({ title: "Group logo uploaded", description: "Logo has been set for the group" });
    } catch (err) {
      console.error('Room logo upload failed', err);
      toast({ title: "Upload failed", description: "Could not upload logo. Try again.", variant: "destructive" });
    }
  };

  const triggerImageUpload = () => fileInputRef.current?.click();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Require registered + email-verified users to create rooms
    if (!user || user.type === 'guest') {
      toast({ title: 'Registration required', description: 'Please register before creating a room.', action: (
        <button className="px-3 py-1 bg-primary text-white rounded" onClick={() => navigate('/settings')}>Go to Settings</button>
      ) });
      return;
    }
    if (!user.emailVerified) {
      toast({ title: 'Email verification required', description: 'Please verify your email before creating a room.', action: (
        <button className="px-3 py-1 bg-primary text-white rounded" onClick={async () => { if (user?.email) { await resendEmailVerification(user.email); toast({ title: 'Verification sent', description: 'Check your inbox' }); } }}>Resend verification</button>
      ) });
      return;
    }
    if (!formData.name.trim()) return;
    const maxMembersNum = parseInt(formData.maxMembers);
    if (!isPremium && maxMembersNum > 10000) {
      toast({ title: "Premium Required", description: "Groups with more than 10,000 members require a Premium subscription.", variant: "destructive" });
      return;
    }
    const finalCategory = formData.category === 'other' && customCategory.trim() ? customCategory.trim() : formData.category;
    const newGroup = {
      id: `group_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: finalCategory,
      type: formData.type,
      members: 1,
      maxMembers: maxMembersNum,
      createdAt: new Date().toISOString(),
      isOwner: true,
      image: formData.image
    };

    try {
      const roomId = await RoomService.createRoom({
        name: newGroup.name,
        description: newGroup.description,
        category: newGroup.category,
        type: newGroup.type,
        participants: [user?.id || user?.uid || ''],
        members: [user?.id || user?.uid || ''],
        settings: {},
        roomImage: newGroup.image
      });
      toast({ title: 'Group created', description: `Created ${newGroup.name}` });
      navigate(`/chat/${roomId}`);
    } catch (err) {
      console.error('Failed to create room', err);
      toast({ title: 'Creation failed', description: 'Could not create room. Try again later.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-gray-900 dark:to-gray-800 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Create New Room
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="groupName">Room Name *</Label>
                <Input id="groupName" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Enter room name" required />
              </div>

              <div>
                <Label>Room Logo</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Avatar className="w-16 h-16">
                    {formData.image && (<AvatarImage src={formData.image} alt="Room" />)}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">{formData.name ? formData.name.charAt(0).toUpperCase() : 'R'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={triggerImageUpload} className="flex items-center gap-2"><Camera className="w-4 h-4" />{formData.image ? 'Change Logo' : 'Upload Logo'}</Button>
                    {formData.image && (<Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, image: '' }))} className="text-xs">Remove Logo</Button>)}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <p className="text-xs text-muted-foreground mt-2">Upload a logo for your room (max 1MB)</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="What's this room about?" />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => { setFormData(prev => ({ ...prev, category: value })); if (value !== 'other') setCustomCategory(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (<SelectItem key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>))}
                  </SelectContent>
                </Select>
                {formData.category === 'other' && (<div className="mt-2"><Input placeholder="Enter custom category name" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="mt-1" /></div>)}
              </div>

              <div>
                <Label>Privacy Setting</Label>
                <RadioGroup value={formData.type} onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, type: value }))} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="flex items-center gap-2"><Globe className="w-4 h-4" />Public - Anyone can join</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" disabled={!isPremium} />
                    <Label htmlFor="private" className={`flex items-center gap-2 ${!isPremium ? 'opacity-50' : ''}`}><Lock className="w-4 h-4" />Private - Invite only{!isPremium && (<span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full flex items-center gap-1"><Crown className="w-3 h-3" />Premium</span>)}</Label>
                  </div>
                </RadioGroup>
                {!isPremium && (<p className="text-xs text-muted-foreground mt-2">Upgrade to Premium to create private rooms</p>)}
              </div>

              <div>
                <Label htmlFor="maxMembers">Max Members</Label>
                <Select value={formData.maxMembers} onValueChange={(value) => setFormData(prev => ({ ...prev, maxMembers: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 members</SelectItem>
                    <SelectItem value="25">25 members</SelectItem>
                    <SelectItem value="50">50 members</SelectItem>
                    <SelectItem value="100">100 members</SelectItem>
                    <SelectItem value="500">500 members</SelectItem>
                    <SelectItem value="1000">1,000 members</SelectItem>
                    <SelectItem value="5000">5,000 members</SelectItem>
                    <SelectItem value="10000">10,000 members</SelectItem>
                    {isPremium ? (
                      <>
                        <SelectItem value="25000"><div className="flex items-center gap-2"><Star className="w-3 h-3 text-purple-500" />25,000 members (Premium)</div></SelectItem>
                        <SelectItem value="50000"><div className="flex items-center gap-2"><Star className="w-3 h-3 text-purple-500" />50,000 members (Premium)</div></SelectItem>
                        <SelectItem value="100000"><div className="flex items-center gap-2"><Star className="w-3 h-3 text-purple-500" />1,00,000 members (Premium)</div></SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="25000" disabled><div className="flex items-center gap-2 opacity-50"><Lock className="w-3 h-3" />25,000 members (Premium Required)</div></SelectItem>
                        <SelectItem value="50000" disabled><div className="flex items-center gap-2 opacity-50"><Lock className="w-3 h-3" />50,000 members (Premium Required)</div></SelectItem>
                        <SelectItem value="100000" disabled><div className="flex items-center gap-2 opacity-50"><Lock className="w-3 h-3" />1,00,000 members (Premium Required)</div></SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!isPremium && (<p className="text-xs text-muted-foreground mt-1"><Lock className="w-3 h-3 inline mr-1" />Groups with 10K+ members require Premium subscription</p>)}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 chat-gradient text-white">Create Room</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateRoom;
