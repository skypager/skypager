<a name="search"></a>

## search()
author:bcoe: Show/filter results in which bcoe is the author
  maintainer:bcoe: Show/filter results in which bcoe is qualifier as a maintainer
  keywords:batman: Show/filter results that have batman in the keywords
  separating multiple keywords with
  , acts like a logical OR
  + acts like a logical AND
  ,- can be used to exclude keywords
  not:unstable: Exclude packages whose version is < 1.0.0
  not:insecure: Exclude packages that are insecure or have vulnerable dependencies (based on the nsp registry)
  is:unstable: Show/filter packages whose version is < 1.0.0
  is:insecure: Show/filter packages that are insecure or have vulnerable dependencies (based on the nsp registry)
  boost-exact:false: Do not boost exact matches, defaults to true

**Kind**: global function