export type SearchType = {
  id: number;
  recommend: number;
  reply: number;
  postDate: number;
  title: string;
  category: string;
  gallId: string;
};

export type SortOptionType = "최신순" | "추천순" | "댓글순";

export type Page<T> = {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};
