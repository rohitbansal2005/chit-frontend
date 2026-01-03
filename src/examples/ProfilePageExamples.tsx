// Example usage of ProfilePage component with different privacy scenarios

import { ProfilePage } from "@/components/ProfilePage";

// Example 1: Own Profile (Full access)
const MyProfileExample = () => {
  const currentUser = {
    id: "user123",
    name: "Rohit Kumar",
    type: "email" as const,
    email: "rohit@example.com",
    avatar: "/avatar.jpg",
    bio: "Full-stack developer passionate about creating amazing chat experiences",
    age: 25,
    gender: "male",
    location: "Delhi",
    country: "India",
    badges: ["verified", "active", "premium"],
    joinedDate: "January 2024",
    isOnline: true,
    friendsCount: 42,
    messagesCount: 1250,
    isVerified: true
  };

  const handleUpdateUser = (updatedUser: any) => {
    console.log("User updated:", updatedUser);
    // Update user in database
  };

  return (
    <ProfilePage
      user={currentUser}
      currentUser={currentUser}
      isOwnProfile={true}
      onBack={() => console.log("Back clicked")}
      onUpdateUser={handleUpdateUser}
    />
  );
};

// Example 2: Public Profile (Stranger can view)
const PublicProfileExample = () => {
  const viewedUser = {
    id: "user456",
    name: "Alex Smith",
    type: "email" as const,
    email: "alex@example.com",
    avatar: "/alex-avatar.jpg",
    bio: "Love chatting with people from around the world!",
    age: 28,
    gender: "female",
    location: "Mumbai",
    country: "India",
    badges: ["verified", "active"],
    joinedDate: "March 2024",
    isOnline: false,
    lastSeen: "2 hours ago",
    friendsCount: 67,
    messagesCount: 890,
    isVerified: true
  };

  const currentUser = {
    id: "user123",
    name: "Rohit Kumar",
    type: "email" as const
  };

  const publicPrivacySettings = {
    profileVisibility: "public" as const,
    showEmail: false,
    showAge: true,
    showLocation: true,
    showLastSeen: true,
    allowMessages: "everyone" as const,
    allowFriendRequests: true
  };

  return (
    <ProfilePage
      user={viewedUser}
      currentUser={currentUser}
      isOwnProfile={false}
      isFriend={false}
      isBlocked={false}
      privacySettings={publicPrivacySettings}
      onBack={() => console.log("Back clicked")}
      onSendMessage={(userId) => console.log("Send message to:", userId)}
      onAddFriend={(userId) => console.log("Add friend:", userId)}
      onBlock={(userId) => console.log("Block user:", userId)}
      onReport={(userId) => console.log("Report user:", userId)}
    />
  );
};

// Example 3: Friends-Only Profile (Must be friends to view)
const FriendsOnlyProfileExample = () => {
  const viewedUser = {
    id: "user789",
    name: "Sarah Johnson",
    type: "email" as const,
    email: "sarah@example.com",
    avatar: "/sarah-avatar.jpg",
    bio: "Privacy-conscious user who only shares with friends",
    age: 30,
    gender: "female",
    location: "Bangalore",
    country: "India",
    badges: ["verified"],
    joinedDate: "February 2024",
    isOnline: true,
    friendsCount: 23,
    messagesCount: 445,
    isVerified: true
  };

  const currentUser = {
    id: "user123",
    name: "Rohit Kumar",
    type: "email" as const
  };

  const friendsOnlyPrivacySettings = {
    profileVisibility: "friends" as const,
    showEmail: false,
    showAge: false,
    showLocation: true,
    showLastSeen: false,
    allowMessages: "friends" as const,
    allowFriendRequests: true
  };

  return (
    <ProfilePage
      user={viewedUser}
      currentUser={currentUser}
      isOwnProfile={false}
      isFriend={true} // User is already a friend
      isBlocked={false}
      privacySettings={friendsOnlyPrivacySettings}
      onBack={() => console.log("Back clicked")}
      onSendMessage={(userId) => console.log("Send message to friend:", userId)}
      onRemoveFriend={(userId) => console.log("Remove friend:", userId)}
      onBlock={(userId) => console.log("Block user:", userId)}
      onReport={(userId) => console.log("Report user:", userId)}
    />
  );
};

// Example 4: Private Profile (Blocked access)
const PrivateProfileExample = () => {
  const viewedUser = {
    id: "user999",
    name: "Private User",
    type: "email" as const,
    badges: ["verified"],
    joinedDate: "April 2024",
    isOnline: false
  };

  const currentUser = {
    id: "user123",
    name: "Rohit Kumar",
    type: "email" as const
  };

  const privatePrivacySettings = {
    profileVisibility: "private" as const,
    showEmail: false,
    showAge: false,
    showLocation: false,
    showLastSeen: false,
    allowMessages: "none" as const,
    allowFriendRequests: false
  };

  return (
    <ProfilePage
      user={viewedUser}
      currentUser={currentUser}
      isOwnProfile={false}
      isFriend={false}
      isBlocked={false}
      privacySettings={privatePrivacySettings}
      onBack={() => console.log("Back clicked")}
      onAddFriend={(userId) => console.log("Add friend:", userId)}
    />
  );
};

// Example 5: Guest User Profile
const GuestProfileExample = () => {
  const guestUser = {
    id: "guest456",
    name: "TempUser_789",
    type: "guest" as const,
    bio: "Just checking out this chat app!",
    location: "Unknown",
    joinedDate: "Today",
    isOnline: true,
    messagesCount: 5,
    isVerified: false
  };

  const currentUser = {
    id: "user123",
    name: "Rohit Kumar",
    type: "email" as const
  };

  const guestPrivacySettings = {
    profileVisibility: "public" as const,
    showEmail: false,
    showAge: false,
    showLocation: false,
    showLastSeen: true,
    allowMessages: "everyone" as const,
    allowFriendRequests: false // Guests can't have permanent friends
  };

  return (
    <ProfilePage
      user={guestUser}
      currentUser={currentUser}
      isOwnProfile={false}
      isFriend={false}
      isBlocked={false}
      privacySettings={guestPrivacySettings}
      onBack={() => console.log("Back clicked")}
      onSendMessage={(userId) => console.log("Send message to guest:", userId)}
      onReport={(userId) => console.log("Report guest user:", userId)}
    />
  );
};

export {
  MyProfileExample,
  PublicProfileExample,
  FriendsOnlyProfileExample,
  PrivateProfileExample,
  GuestProfileExample
};
