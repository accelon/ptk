export const bsearchNumber = (arr:number[], obj:number) =>{
  let low = 0, high = arr.length-1, mid;
  while (low < high) {
    mid = (low + high) >> 1;
    if (arr[mid] === obj)  {
      while (mid>-1 &&arr[mid-1]===obj ) mid--; //值重覆的元素，回逆到第一個
      return mid;
    }
    (arr[mid] < obj) ? low = mid + 1 : high = mid;
  }
  return low;
}

export const bsearch = (arr:string[], obj:string) =>{
  let low = 0, high = arr.length-1, mid;
  while (low < high) {
    mid = (low + high) >> 1;
    if (arr[mid] === obj)  {
      while (mid>-1 &&arr[mid-1]===obj ) mid--; //值重覆的元素，回逆到第一個
      return mid;
    }
    (arr[mid] < obj) ? low = mid + 1 : high = mid;
  }
  return low;
}

export type StringGetter = (idx:number) => string ;
export const bsearchgetter =  (getter: StringGetter, obj:string) =>{  
  const len=parseInt(getter(0)); //get the len
  let low = 1,high = len;  //getter is 1-based
  while (low < high) {
    let mid = (low + high) >> 1;
    if (getter(mid)===obj) {
      while (mid>-1 &&getter(mid-1)===obj ) mid--; //值重覆的元素，回逆到第一個
      return mid<len?mid:len-1;
    }
    getter(mid)<obj ? low=mid+1 : high=mid;
  }

  return low<len?low:len;
}

