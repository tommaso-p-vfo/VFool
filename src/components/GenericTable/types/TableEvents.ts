export type TableEvents<T> = {
    onAdd?: () => void;
    onEdit?: (data: T) => void;
    onDelete?: (data: T) => void;
    onView?: (data: T) => void;
    onShowComments?: (data: T) => void;
}