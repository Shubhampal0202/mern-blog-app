export function createInitials(fullName) {
  let initials = fullName
    .trim()
    .split(" ")
    .map((val) => val[0])
    .join("")
    .toUpperCase();
  return initials;
}
