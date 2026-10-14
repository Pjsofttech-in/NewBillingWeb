import {useState} from "react";

export const usePagination = (
  data = [],
  initialItemsPerPage = 25,
  searchDependency = "",
) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [prevSearch, setPrevSearch] = useState(searchDependency);

  if (prevSearch !== searchDependency) {
    setPrevSearch(searchDependency);
    setCurrentPage(1);
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return {
    currentPage: validPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    paginatedData,
  };
};
