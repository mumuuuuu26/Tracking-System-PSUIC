import React, { useEffect, useMemo, useState } from "react";
import { getImageUrl } from "../../utils/imageUrl";
import { getUserInitials } from "../../utils/userIdentity";

const ProfileAvatar = ({
  user,
  picture,
  name,
  username,
  email,
  alt = "Profile",
  className = "",
  imageClassName = "w-full h-full object-cover",
  fallbackClassName = "w-full h-full flex items-center justify-center bg-[#1e2e4a] text-white",
  initialsClassName = "text-sm font-bold",
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const resolvedPicture = useMemo(
    () => picture ?? user?.picture ?? "",
    [picture, user?.picture],
  );

  const initials = useMemo(
    () =>
      getUserInitials(
        {
          name: name ?? user?.name,
          username: username ?? user?.username,
          email: email ?? user?.email,
        },
        "U",
      ),
    [email, name, user?.email, user?.name, user?.username, username],
  );

  useEffect(() => {
    setHasImageError(false);
  }, [resolvedPicture]);

  const imageSrc = resolvedPicture ? getImageUrl(resolvedPicture) : "";
  const shouldShowImage = Boolean(imageSrc && !hasImageError);

  return (
    <div className={className}>
      {shouldShowImage ? (
        <img
          src={imageSrc}
          alt={alt}
          className={imageClassName}
          onError={() => setHasImageError(true)}
        />
      ) : (
        <div className={fallbackClassName} aria-label={`${alt} fallback`}>
          <span className={initialsClassName}>{initials}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
