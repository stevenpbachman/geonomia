

# Sortable Cluster Search Results

## Overview
Add clickable column headers to the cluster search results table, allowing ascending/descending sorting by date range, cluster ID, cluster count, and unique date count. Two new data columns will also be displayed.

## Changes

### 1. Update `src/lib/datasette.ts`
- Add `cluster_num_id_count` and `eventDate_unique_count` to the `ClusterResult` interface
- Update the SQL query to `SELECT` these two additional columns

### 2. Update `src/components/ClusterSearch.tsx`
- Add sort state: `sortColumn` (field name) and `sortDirection` (`asc` | `desc`)
- Add a `useMemo` that sorts the `results` array client-side based on sort state
- Make table headers clickable with sort direction indicators (arrows)
- Add two new columns: "Records" (cluster_num_id_count) and "Dates" (eventDate_unique_count)
- Clicking a header toggles asc/desc; clicking a different header sorts by that column ascending
- Sortable columns: Date range (eventDate_min), Cluster ID (cluster_num_id), Records count, Unique dates count

## Technical Details
- Sorting is done client-side on the already-fetched 200 results (no additional API calls)
- Default sort remains by `eventDate_min` ascending (matching current SQL `ORDER BY`)
- Sort indicators use `ArrowUp`/`ArrowDown` icons from lucide-react

