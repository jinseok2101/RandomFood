import {
  CATEGORY_MAP,
  CATEGORY_STYLES,
  CATEGORIES,
} from "../constants/MapConstants";

export const checkCategory = (itemCat: string, selectedCat: string) => {
  if (selectedCat === "전체") return true;
  return (
    CATEGORY_MAP[selectedCat]?.some((k) => itemCat.includes(k)) ||
    itemCat.includes(selectedCat)
  );
};

export const getCategoryColor = (category: string) => {
  for (const cat of CATEGORIES) {
    if (cat !== "전체" && checkCategory(category, cat))
      return CATEGORY_STYLES[cat];
  }
  return CATEGORY_STYLES["기타"];
};

export const getCleanTitle = (title: string) => title.replace(/<[^>]*>?/gm, "");
