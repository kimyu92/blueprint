/**
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain a copy
 * of the license at https://github.com/palantir/blueprint/blob/master/LICENSE
 * and https://github.com/palantir/blueprint/blob/master/PATENTS
 */

import { AbstractComponent, IProps, Utils as BlueprintUtils } from "@blueprintjs/core";
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core";
import * as classNames from "classnames";
import * as React from "react";

import { ICellProps } from "./cell/cell";
import { Column, IColumnProps } from "./column";
import { IFocusedCellCoordinates } from "./common/cell";
import * as Classes from "./common/classes";
import { Clipboard } from "./common/clipboard";
import { Grid, IColumnIndices, IRowIndices } from "./common/grid";
import { Rect } from "./common/rect";
import { Utils } from "./common/utils";
import { ColumnHeader, IColumnWidths } from "./headers/columnHeader";
import { ColumnHeaderCell, IColumnHeaderCellProps } from "./headers/columnHeaderCell";
import { IRowHeaderRenderer, IRowHeights, renderDefaultRowHeader, RowHeader } from "./headers/rowHeader";
import { IContextMenuRenderer } from "./interactions/menus";
import { IIndexedResizeCallback } from "./interactions/resizable";
import { ResizeSensor } from "./interactions/resizeSensor";
import { ISelectedRegionTransform } from "./interactions/selectable";
import { GuideLayer } from "./layers/guides";
import { IRegionStyler, RegionLayer } from "./layers/regions";
import { Locator } from "./locator";
import {
    ColumnLoadingOption,
    IRegion,
    IStyledRegionGroup,
    RegionCardinality,
    Regions,
    SelectionModes,
    TableLoadingOption,
} from "./regions";
import { TableBody } from "./tableBody";

export interface ITableProps extends IProps, IRowHeights, IColumnWidths {
    /**
     * If `false`, only a single region of a single column/row/cell may be
     * selected at one time. Using `ctrl` or `meta` key will have no effect,
     * and a mouse drag will select the current column/row/cell only.
     * @default true
     */
    allowMultipleSelection?: boolean;

    /**
     * The children of a `Table` component, which must be React elements
     * that use `IColumnProps`.
     */
    children?: React.ReactElement<IColumnProps> | Array<React.ReactElement<IColumnProps>>;

    /**
     * A sparse number array with a length equal to the number of columns. Any
     * non-null value will be used to set the width of the column at the same
     * index. Note that if you want to update these values when the user
     * drag-resizes a column, you may define a callback for `onColumnWidthChanged`.
     */
    columnWidths?: Array<number | null | undefined>;

    /**
     * If `true`, there will be a single "focused" cell at all times,
     * which can be used to interact with the table as though it is a
     * spreadsheet. When false, no such cell will exist.
     * @default false
     */
    enableFocus?: boolean;

    /**
     * If `true`, empty space in the table container will be filled with empty
     * cells instead of a blank background.
     * @default false
     */
    fillBodyWithGhostCells?: boolean;

    /**
     * If defined, will set the focused cell state. This changes
     * the focused cell to controlled mode, meaning you are in charge of
     * setting the focus in response to events in the `onFocus` callback.
     */
    focusedCell?: IFocusedCellCoordinates;

    /**
     * If defined, this callback will be invoked for each cell when the user
     * attempts to copy a selection via `mod+c`. The returned data will be copied
     * to the clipboard and need not match the display value of the `<Cell>`.
     * The data will be invisibly added as `textContent` into the DOM before
     * copying. If not defined, keyboard copying via `mod+c` will be disabled.
     */
    getCellClipboardData?: (row: number, col: number) => any;

    /**
     * If `false`, disables reordering of columns.
     * @default false
     */
    isColumnReorderable?: boolean;

    /**
     * If `false`, disables resizing of columns.
     * @default true
     */
    isColumnResizable?: boolean;

    /**
     * If `false`, hides the row headers and settings menu.
     * @default true
     */
    isRowHeaderShown?: boolean;

    /**
     * If `false`, disables reordering of rows.
     * @default false
     */
    isRowReorderable?: boolean;

    /**
     * If `false`, disables resizing of rows.
     * @default false
     */
    isRowResizable?: boolean;

    /**
     * A list of `TableLoadingOption`. Set this prop to specify whether to
     * render the loading state for the column header, row header, and body
     * sections of the table.
     */
    loadingOptions?: TableLoadingOption[];

    /**
     * The number of rows in the table.
     */
    numRows?: number;

    /**
     * If reordering is enabled, this callback will be invoked when the user finishes
     * drag-reordering one or more columns.
     */
    onColumnsReordered?: (oldIndex: number, newIndex: number, length: number) => void;

    /**
     * If resizing is enabled, this callback will be invoked when the user
     * finishes drag-resizing a column.
     */
    onColumnWidthChanged?: IIndexedResizeCallback;

    /**
     * If you want to do something after the copy or if you want to notify the
     * user if a copy fails, you may provide this optional callback.
     *
     * Due to browser limitations, the copy can fail. This usually occurs if
     * the selection is too large, like 20,000+ cells. The copy will also fail
     * if the browser does not support the copy method (see
     * `Clipboard.isCopySupported`).
     */
    onCopy?: (success: boolean) => void;

    /**
     * A callback called when the focus is changed in the table.
     */
    onFocus?: (focusedCell: IFocusedCellCoordinates) => void;

    /**
     * If resizing is enabled, this callback will be invoked when the user
     * finishes drag-resizing a row.
     */
    onRowHeightChanged?: IIndexedResizeCallback;

    /**
     * If reordering is enabled, this callback will be invoked when the user finishes
     * drag-reordering one or more rows.
     */
    onRowsReordered?: (oldIndex: number, newIndex: number, length: number) => void;

    /**
     * A callback called when the selection is changed in the table.
     */
    onSelection?: (selectedRegions: IRegion[]) => void;

    /**
     * A callback called when the visible cell indices change in the table.
     */
    onVisibleCellsChange?: (rowIndices: IRowIndices, columnIndices: IColumnIndices) => void;

    /**
     * An optional callback for displaying a context menu when right-clicking
     * on the table body. The callback is supplied with an array of
     * `IRegion`s. If the mouse click was on a selection, the array will
     * contain all selected regions. Otherwise it will have one `IRegion` that
     * represents the clicked cell.
     */
    renderBodyContextMenu?: IContextMenuRenderer;

    /**
     * Render each row's header cell.
     */
    renderRowHeader?: IRowHeaderRenderer;

    /**
     * A sparse number array with a length equal to the number of rows. Any
     * non-null value will be used to set the height of the row at the same
     * index. Note that if you want to update these values when the user
     * drag-resizes a row, you may define a callback for `onRowHeightChanged`.
     */
    rowHeights?: Array<number | null | undefined>;

    /**
     * If defined, will set the selected regions in the cells. If defined, this
     * changes table selection to controlled mode, meaning you in charge of
     * setting the selections in response to events in the `onSelection`
     * callback.
     *
     * Note that the `selectionModes` prop controls which types of events are
     * triggered to the `onSelection` callback, but does not restrict what
     * selection you can pass to the `selectedRegions` prop. Therefore you can,
     * for example, convert cell clicks into row selections.
     */
    selectedRegions?: IRegion[];

    /**
     * An optional transform function that will be applied to the located
     * `Region`.
     *
     * This allows you to, for example, convert cell `Region`s into row
     * `Region`s while maintaining the existing multi-select and meta-click
     * functionality.
     */
    selectedRegionTransform?: ISelectedRegionTransform;

    /**
     * A `SelectionModes` enum value indicating the selection mode. You may
     * equivalently provide an array of `RegionCardinality` enum values for
     * precise configuration.
     *
     * The `SelectionModes` enum values are:
     * - `ALL`
     * - `NONE`
     * - `COLUMNS_AND_CELLS`
     * - `COLUMNS_ONLY`
     * - `ROWS_AND_CELLS`
     * - `ROWS_ONLY`
     *
     * The `RegionCardinality` enum values are:
     * - `FULL_COLUMNS`
     * - `FULL_ROWS`
     * - `FULL_TABLE`
     * - `CELLS`
     *
     * @default SelectionModes.ALL
     */
    selectionModes?: RegionCardinality[];

    /**
     * Styled region groups are rendered as overlays above the table and are
     * marked with their own `className` for custom styling.
     */
    styledRegionGroups?: IStyledRegionGroup[];
}

export interface ITableState {
    /**
     * An array of column widths. These are initialized from the column props
     * and updated when the user drags column header resize handles.
     */
    columnWidths?: number[];

    /**
     * The coordinates of the currently focused table cell
     */
    focusedCell?: IFocusedCellCoordinates;

    /**
     * An array of pixel offsets for resize guides, which are drawn over the
     * table body when a row is being resized.
     */
    horizontalGuides?: number[];

    /**
     * If `true`, will disable updates that will cause re-renders of children
     * components. This is used, for example, to disable layout updates while
     * the user is dragging a resize handle.
     */
    isLayoutLocked?: boolean;

    /**
     * Whether the user is currently dragging to reorder one or more elements.
     * Can be referenced to toggle the reordering-cursor overlay, which
     * displays a `grabbing` CSS cursor wherever the mouse moves in the table
     * for the duration of the dragging interaction.
     */
    isReordering?: boolean;

    /**
     * An array of row heights. These are initialized updated when the user
     * drags row header resize handles.
     */
    rowHeights?: number[];

    /**
     * An array of Regions representing the selections of the table.
     */
    selectedRegions?: IRegion[];

    /**
     * An array of pixel offsets for resize guides, which are drawn over the
     * table body when a column is being resized.
     */
    verticalGuides?: number[];

    /**
     * The `Rect` bounds of the viewport used to perform virtual viewport
     * performance enhancements.
     */
    viewportRect?: Rect;

}

@HotkeysTarget
export class Table extends AbstractComponent<ITableProps, ITableState> {
    public static defaultProps: ITableProps = {
        allowMultipleSelection: true,
        defaultColumnWidth: 150,
        defaultRowHeight: 20,
        enableFocus: false,
        fillBodyWithGhostCells: false,
        isRowHeaderShown: true,
        loadingOptions: [],
        minColumnWidth: 50,
        minRowHeight: 20,
        numRows: 0,
        renderRowHeader: renderDefaultRowHeader,
        selectionModes: SelectionModes.ALL,
    };

    // these blacklists are identical, but we still need two definitions due to the different typings

    private static SHALLOW_COMPARE_PROP_KEYS_BLACKLIST = [
        "selectedRegions", // (intentionally omitted; can be deeply compared to save on re-renders in controlled mode)
    ] as Array<keyof ITableProps>;

    private static SHALLOW_COMPARE_STATE_KEYS_BLACKLIST = [
        "selectedRegions", // (intentionally omitted; can be deeply compared to save on re-renders in uncontrolled mode)
    ] as Array<keyof ITableState>;

    private static createColumnIdIndex(children: Array<React.ReactElement<any>>) {
        const columnIdToIndex: {[key: string]: number} = {};
        for (let i = 0; i < children.length; i++) {
            const key = children[i].props.id;
            if (key != null) {
                columnIdToIndex[String(key)] = i;
            }
        }
        return columnIdToIndex;
    }

    public grid: Grid;
    public locator: Locator;

    private bodyElement: HTMLElement;
    private childrenArray: Array<React.ReactElement<IColumnProps>>;
    private columnIdToIndex: {[key: string]: number};
    private menuElement: HTMLElement;
    private resizeSensorDetach: () => void;
    private rootTableElement: HTMLElement;
    private rowHeaderElement: HTMLElement;

    public constructor(props: ITableProps, context?: any) {
        super(props, context);

        const { defaultRowHeight, defaultColumnWidth, numRows, columnWidths, rowHeights, children } = this.props;
        this.childrenArray = React.Children.toArray(children) as Array<React.ReactElement<IColumnProps>>;
        this.columnIdToIndex = Table.createColumnIdIndex(this.childrenArray);

        // Create height/width arrays using the lengths from props and
        // children, the default values from props, and finally any sparse
        // arrays passed into props.
        let newColumnWidths = this.childrenArray.map(() => defaultColumnWidth);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, columnWidths);
        let newRowHeights = Utils.times(numRows, () => defaultRowHeight);
        newRowHeights = Utils.assignSparseValues(newRowHeights, rowHeights);

        const selectedRegions = (props.selectedRegions == null) ? [] as IRegion[] : props.selectedRegions;

        let focusedCell: IFocusedCellCoordinates;
        if (props.enableFocus) {
            if (props.focusedCell != null) {
                focusedCell = props.focusedCell;
            } else {
                focusedCell = { col: 0, row: 0, focusSelectionIndex: 0 };
            }
        }

        this.state = {
            columnWidths: newColumnWidths,
            focusedCell,
            isLayoutLocked: false,
            isReordering: false,
            rowHeights: newRowHeights,
            selectedRegions,
        };
    }

    public shouldComponentUpdate(nextProps: ITableProps, nextState: ITableState) {
        const propKeysBlacklist = { exclude: Table.SHALLOW_COMPARE_PROP_KEYS_BLACKLIST };
        const stateKeysBlacklist = { exclude: Table.SHALLOW_COMPARE_STATE_KEYS_BLACKLIST };

        return !Utils.shallowCompareKeys(this.props, nextProps, propKeysBlacklist)
            || !Utils.shallowCompareKeys(this.state, nextState, stateKeysBlacklist)
            || !Utils.deepCompareKeys(this.props, nextProps, ["selectedRegions"])
            || !Utils.deepCompareKeys(this.state, nextState, ["selectedRegions"]);
    }

    public componentWillReceiveProps(nextProps: ITableProps) {
        const {
            defaultRowHeight,
            defaultColumnWidth,
            columnWidths,
            enableFocus,
            focusedCell,
            rowHeights,
            children,
            numRows,
            selectedRegions,
            selectionModes,
        } = nextProps;

        const newChildArray = React.Children.toArray(children) as Array<React.ReactElement<IColumnProps>>;

        // Try to maintain widths of columns by looking up the width of the
        // column that had the same `ID` prop. If none is found, use the
        // previous width at the same index.
        const previousColumnWidths = newChildArray.map((child: React.ReactElement<IColumnProps>, index: number) => {
            const mappedIndex = this.columnIdToIndex[child.props.id];
            return this.state.columnWidths[mappedIndex != null ? mappedIndex : index];
        });

        // Make sure the width/height arrays have the correct length, but keep
        // as many existing widths/heights when possible. Also, apply the
        // sparse width/heights from props.
        let newColumnWidths = this.state.columnWidths;
        newColumnWidths = Utils.arrayOfLength(newColumnWidths, newChildArray.length, defaultColumnWidth);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, previousColumnWidths);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, columnWidths);

        let newRowHeights = this.state.rowHeights;
        newRowHeights = Utils.arrayOfLength(newRowHeights, numRows, defaultRowHeight);
        newRowHeights = Utils.assignSparseValues(newRowHeights, rowHeights);

        const numCols = newColumnWidths.length;

        let newSelectedRegions = selectedRegions;
        if (selectedRegions == null) {
            // if we're in uncontrolled mode, filter out all selected regions that don't
            // fit in the current new table dimensions
            newSelectedRegions = this.state.selectedRegions.filter((region) => {
                const regionCardinality = Regions.getRegionCardinality(region);
                const isSelectionModeEnabled = selectionModes.indexOf(regionCardinality) >= 0;
                return isSelectionModeEnabled && Regions.isRegionValidForTable(region, numRows, numCols);
            });
        }
        const newFocusedCellCoordinates = (focusedCell == null)
            ? this.state.focusedCell
            : focusedCell;

        this.childrenArray = newChildArray;
        this.columnIdToIndex = Table.createColumnIdIndex(this.childrenArray);
        this.invalidateGrid();
        this.setState({
            columnWidths: newColumnWidths,
            focusedCell: enableFocus ? newFocusedCellCoordinates : undefined,
            rowHeights: newRowHeights,
            selectedRegions: newSelectedRegions,
        });
    }

    public render() {
        const { className, isRowHeaderShown } = this.props;
        this.validateGrid();

        const classes = classNames(Classes.TABLE_CONTAINER, {
            [Classes.TABLE_REORDERING]: this.state.isReordering,
        }, className);

        return (
            <div
                className={classes}
                ref={this.setRootTableRef}
                onScroll={this.handleRootScroll}
            >
                 <div className={Classes.TABLE_TOP_CONTAINER}>
                    {isRowHeaderShown ? this.renderMenu() : undefined}
                    {this.renderColumnHeader()}
                </div>
                <div className={Classes.TABLE_BOTTOM_CONTAINER}>
                    {isRowHeaderShown ? this.renderRowHeader() : undefined}
                    {this.renderBody()}
                </div>
                <div className={classNames(Classes.TABLE_OVERLAY_LAYER, "bp-table-reordering-cursor-overlay")} />
            </div>
        );
    }

    public renderHotkeys() {
        const hotkeys =
            [this.maybeRenderCopyHotkey(), this.maybeRenderSelectAllHotkey(), this.maybeRenderFocusHotkeys()];
        return (
            <Hotkeys>
                {hotkeys.filter((element) => element !== undefined)}
            </Hotkeys>
        );
    }

    /**
     * Resize all rows in the table to the height of the tallest visible cell in the specified columns.
     * If no indices are provided, default to using the tallest visible cell from all columns in view.
     */
    public resizeRowsByTallestCell(columnIndices?: number | number[]) {
        let tallest = 0;
        if (columnIndices == null) {
            // Consider all columns currently in viewport
            const viewportColumnIndices = this.grid.getColumnIndicesInRect(this.state.viewportRect);
            for (let col = viewportColumnIndices.columnIndexStart; col <= viewportColumnIndices.columnIndexEnd; col++) {
                tallest = Math.max(tallest, this.locator.getTallestVisibleCellInColumn(col));
            }
        } else {
            const columnIndicesArray = Array.isArray(columnIndices) ? columnIndices : [columnIndices];
            const tallestByColumns = columnIndicesArray.map((col) => this.locator.getTallestVisibleCellInColumn(col));
            tallest = Math.max(...tallestByColumns);
        }
        const rowHeights = Array(this.state.rowHeights.length).fill(tallest);
        this.invalidateGrid();
        this.setState({ rowHeights });
    }

    /**
     * When the component mounts, the HTML Element refs will be available, so
     * we constructor the Locator, which queries the elements' bounding
     * ClientRects.
     */
    public componentDidMount() {
        this.validateGrid();
        this.locator = new Locator(
            this.rootTableElement,
            this.bodyElement,
            this.grid,
        );
        this.updateViewportRect(this.locator.getViewportRect());

        this.resizeSensorDetach = ResizeSensor.attach(this.rootTableElement, () => {
            if (!this.state.isLayoutLocked) {
                this.updateViewportRect(this.locator.getViewportRect());
            }
        });

        this.syncMenuWidth();
    }

    public componentWillUnmount() {
        if (this.resizeSensorDetach != null) {
            this.resizeSensorDetach();
            delete this.resizeSensorDetach;
        }
    }

    public componentDidUpdate() {
        if (this.locator != null) {
            this.validateGrid();
            this.locator.setGrid(this.grid);
        }

        this.syncMenuWidth();
        this.maybeScrollTableIntoView();
    }

    protected validateProps(props: ITableProps & { children: React.ReactNode }) {
        const WARNING_MESSAGE = "Children of Table must be Columns";
        React.Children.forEach(props.children, (child: React.ReactElement<any>) => {
            // save as a variable so that union type narrowing works
            const cType = child.type;

            if (typeof cType === "string") {
                console.warn(WARNING_MESSAGE);
            } else {
                const isColumn = cType.prototype === Column.prototype || Column.prototype.isPrototypeOf(cType);
                if (!isColumn) {
                    console.warn(WARNING_MESSAGE);
                }
            }
        });
    }

    private moveFocusCell(
        primaryAxis: "row" | "col",
        secondaryAxis: "row" | "col",
        isUpOrLeft: boolean,
        newFocusedCell: IFocusedCellCoordinates,
        focusCellRegion: IRegion,
    ) {

        const { grid } = this;
        const { selectedRegions } = this.state;

        const primaryAxisPlural = primaryAxis === "row" ? "rows" : "cols";
        const secondaryAxisPlural = secondaryAxis === "row" ? "rows" : "cols";

        const movementDirection = isUpOrLeft ? -1 : +1;
        const regionIntervalIndex = isUpOrLeft ? 1 : 0;

        // try moving the cell in the direction along the primary axis
        newFocusedCell[primaryAxis] += movementDirection;

        const isPrimaryIndexOutOfBounds = isUpOrLeft
            ? newFocusedCell[primaryAxis] < focusCellRegion[primaryAxisPlural][0]
            : newFocusedCell[primaryAxis] > focusCellRegion[primaryAxisPlural][1];

        if (isPrimaryIndexOutOfBounds) {
            // if we moved outside the bounds of selection region,
            // move to the start (or end) of the primary axis, and move one along the secondary
            newFocusedCell[primaryAxis] = focusCellRegion[primaryAxisPlural][regionIntervalIndex];
            newFocusedCell[secondaryAxis] += movementDirection;

            const isSecondaryIndexOutOfBounds = isUpOrLeft
                ? newFocusedCell[secondaryAxis] < focusCellRegion[secondaryAxisPlural][0]
                : newFocusedCell[secondaryAxis] > focusCellRegion[secondaryAxisPlural][1];

            if (isSecondaryIndexOutOfBounds) {
                // if moving along the secondary also moves us outside
                // go to the start (or end) of the next (or previous region)
                // (note that if there's only one region you'll be moving to the opposite corner, which is fine)
                let newFocusCellSelectionIndex = newFocusedCell.focusSelectionIndex + movementDirection;

                // newFocusCellSelectionIndex should be one more (or less), unless we need to wrap around
                if (isUpOrLeft
                    ? newFocusCellSelectionIndex < 0
                    : newFocusCellSelectionIndex >= selectedRegions.length
                ) {
                    newFocusCellSelectionIndex = isUpOrLeft
                        ? selectedRegions.length - 1
                        : 0;
                }

                const newFocusCellRegion = Regions.getCellRegionFromRegion(
                    selectedRegions[newFocusCellSelectionIndex],
                    grid.numRows,
                    grid.numCols,
                );

                newFocusedCell = {
                    col: newFocusCellRegion.cols[regionIntervalIndex],
                    focusSelectionIndex: newFocusCellSelectionIndex,
                    row: newFocusCellRegion.rows[regionIntervalIndex],
                };
            }
        }
        return newFocusedCell;
    }

    private handleCopy = (e: KeyboardEvent) => {
        const { grid } = this;
        const { getCellClipboardData, onCopy} = this.props;
        const { selectedRegions} = this.state;

        if (getCellClipboardData == null) {
            return;
        }

        // prevent "real" copy from being called
        e.preventDefault();
        e.stopPropagation();

        const cells = Regions.enumerateUniqueCells(selectedRegions, grid.numRows, grid.numCols);
        const sparse = Regions.sparseMapCells(cells, getCellClipboardData);
        if (sparse != null) {
            const success = Clipboard.copyCells(sparse);
            BlueprintUtils.safeInvoke(onCopy, success);
        }
    }

    private renderMenu() {
        const classes = classNames(Classes.TABLE_MENU, {
            [Classes.TABLE_SELECTION_ENABLED]: this.isSelectionModeEnabled(RegionCardinality.FULL_TABLE),
        });
        return (
            <div
                className={classes}
                ref={this.setMenuRef}
                onClick={this.selectAll}
            >
                {this.maybeRenderRegions(this.styleMenuRegion)}
            </div>
        );
    }

    private syncMenuWidth() {
        const { menuElement, rowHeaderElement } = this;
        if (menuElement != null && rowHeaderElement != null) {
            const width = rowHeaderElement.getBoundingClientRect().width;
            menuElement.style.width = `${width}px`;
        }
    }

    private maybeScrollTableIntoView() {
        const { viewportRect } = this.state;

        const tableBottom = this.grid.getCumulativeHeightAt(this.grid.numRows - 1);
        const tableRight = this.grid.getCumulativeWidthAt(this.grid.numCols - 1);

        const nextScrollTop = (tableBottom < viewportRect.top + viewportRect.height)
            // scroll the last row into view
            ? Math.max(0, tableBottom - viewportRect.height)
            : viewportRect.top;

        const nextScrollLeft = (tableRight < viewportRect.left + viewportRect.width)
            // scroll the last column into view
            ? Math.max(0, tableRight - viewportRect.width)
            : viewportRect.left;

        this.syncViewportPosition(nextScrollLeft, nextScrollTop);
    }

    private selectAll = () => {
        const selectionHandler = this.getEnabledSelectionHandler(RegionCardinality.FULL_TABLE);
        // clicking on upper left hand corner sets selection to "all"
        // regardless of current selection state (clicking twice does not deselect table)
        selectionHandler([Regions.table()]);

        // move the focus cell to the top left
        const newFocusedCellCoordinates = Regions.getFocusCellCoordinatesFromRegion(RegionCardinality.FULL_TABLE);
        const fullFocusCellCoordinates: IFocusedCellCoordinates = {
            col: newFocusedCellCoordinates.col,
            focusSelectionIndex: 0,
            row: newFocusedCellCoordinates.row,
        };
        this.handleFocus(fullFocusCellCoordinates);
    }

    private handleSelectAllHotkey = (e: KeyboardEvent) => {
        // prevent "real" select all from happening as well
        e.preventDefault();
        e.stopPropagation();

        this.selectAll();
    }

    private getColumnProps(columnIndex: number) {
        const column = this.childrenArray[columnIndex] as React.ReactElement<IColumnProps>;
        return column.props;
    }

    private columnHeaderCellRenderer = (columnIndex: number) => {
        const props = this.getColumnProps(columnIndex);

        const {
            id,
            loadingOptions,
            renderCell,
            renderColumnHeader,
            ...spreadableProps,
        } = props;

        const columnLoading = this.hasLoadingOption(loadingOptions, ColumnLoadingOption.HEADER);

        if (renderColumnHeader != null) {
            const columnHeader = renderColumnHeader(columnIndex);
            const columnHeaderLoading  = columnHeader.props.loading;

            return React.cloneElement(columnHeader, {
                loading: columnHeaderLoading != null ? columnHeaderLoading : columnLoading,
            } as IColumnHeaderCellProps);
        }

        const baseProps: IColumnHeaderCellProps = {
            index: columnIndex,
            loading: columnLoading,
            ...spreadableProps,
        };

        if (props.name != null) {
            return <ColumnHeaderCell {...baseProps} />;
        } else {
            return <ColumnHeaderCell {...baseProps} name={Utils.toBase26Alpha(columnIndex)} />;
        }
    }

    private renderColumnHeader() {
        const { grid, locator } = this;
        const { selectedRegions, viewportRect } = this.state;
        const {
            allowMultipleSelection,
            fillBodyWithGhostCells,
            isColumnReorderable,
            isColumnResizable,
            loadingOptions,
            maxColumnWidth,
            minColumnWidth,
            selectedRegionTransform,
        } = this.props;
        const classes = classNames(Classes.TABLE_COLUMN_HEADERS, {
            [Classes.TABLE_SELECTION_ENABLED]: this.isSelectionModeEnabled(RegionCardinality.FULL_COLUMNS),
        });
        const columnIndices = grid.getColumnIndicesInRect(viewportRect, fillBodyWithGhostCells);

        return (
            <div className={classes}>
                <ColumnHeader
                    allowMultipleSelection={allowMultipleSelection}
                    cellRenderer={this.columnHeaderCellRenderer}
                    grid={grid}
                    isReorderable={isColumnReorderable}
                    isResizable={isColumnResizable}
                    loading={this.hasLoadingOption(loadingOptions, TableLoadingOption.COLUMN_HEADERS)}
                    locator={locator}
                    maxColumnWidth={maxColumnWidth}
                    minColumnWidth={minColumnWidth}
                    onColumnWidthChanged={this.handleColumnWidthChanged}
                    onFocus={this.handleFocus}
                    onLayoutLock={this.handleLayoutLock}
                    onReordered={this.handleColumnsReordered}
                    onReordering={this.handleColumnsReordering}
                    onResizeGuide={this.handleColumnResizeGuide}
                    onSelection={this.getEnabledSelectionHandler(RegionCardinality.FULL_COLUMNS)}
                    selectedRegions={selectedRegions}
                    selectedRegionTransform={selectedRegionTransform}
                    viewportRect={viewportRect}
                    {...columnIndices}
                >
                    {this.props.children}
                </ColumnHeader>

                {this.maybeRenderRegions(this.styleColumnHeaderRegion)}
            </div>
        );
    }

    private renderRowHeader() {
        const { grid, locator } = this;
        const { selectedRegions, viewportRect } = this.state;
        const {
            allowMultipleSelection,
            fillBodyWithGhostCells,
            isRowReorderable,
            isRowResizable,
            loadingOptions,
            maxRowHeight,
            minRowHeight,
            renderRowHeader,
            selectedRegionTransform,
        } = this.props;
        const classes = classNames(Classes.TABLE_ROW_HEADERS, {
            [Classes.TABLE_SELECTION_ENABLED]: this.isSelectionModeEnabled(RegionCardinality.FULL_ROWS),
        });
        const rowIndices = grid.getRowIndicesInRect(viewportRect, fillBodyWithGhostCells);
        return (
            <div
                className={classes}
                ref={this.setRowHeaderRef}
            >
                <RowHeader
                    allowMultipleSelection={allowMultipleSelection}
                    grid={grid}
                    locator={locator}
                    isReorderable={isRowReorderable}
                    isResizable={isRowResizable}
                    loading={this.hasLoadingOption(loadingOptions, TableLoadingOption.ROW_HEADERS)}
                    maxRowHeight={maxRowHeight}
                    minRowHeight={minRowHeight}
                    onFocus={this.handleFocus}
                    onLayoutLock={this.handleLayoutLock}
                    onResizeGuide={this.handleRowResizeGuide}
                    onReordered={this.handleRowsReordered}
                    onReordering={this.handleRowsReordering}
                    onRowHeightChanged={this.handleRowHeightChanged}
                    onSelection={this.getEnabledSelectionHandler(RegionCardinality.FULL_ROWS)}
                    renderRowHeader={renderRowHeader}
                    selectedRegions={selectedRegions}
                    selectedRegionTransform={selectedRegionTransform}
                    viewportRect={viewportRect}
                    {...rowIndices}
                />

                {this.maybeRenderRegions(this.styleRowHeaderRegion)}
            </div>
        );
    }

    private bodyCellRenderer = (rowIndex: number, columnIndex: number) => {
        const columnProps = this.getColumnProps(columnIndex);
        const cell = columnProps.renderCell(rowIndex, columnIndex);
        const cellLoading = cell.props.loading;

        const loading = cellLoading != null
            ? cellLoading
            : this.hasLoadingOption(columnProps.loadingOptions, ColumnLoadingOption.CELLS);

        return React.cloneElement(cell, { ...columnProps, loading } as ICellProps);
    }

    private renderBody() {
        const { grid, locator } = this;
        const {
            allowMultipleSelection,
            fillBodyWithGhostCells,
            loadingOptions,
            renderBodyContextMenu,
            selectedRegionTransform,
        } = this.props;
        const { selectedRegions, viewportRect, verticalGuides, horizontalGuides } = this.state;

        const style = grid.getRect().sizeStyle();
        const rowIndices = grid.getRowIndicesInRect(viewportRect, fillBodyWithGhostCells);
        const columnIndices = grid.getColumnIndicesInRect(viewportRect, fillBodyWithGhostCells);
        const noVerticalScroll = fillBodyWithGhostCells &&
            grid.isGhostIndex(rowIndices.rowIndexEnd, 0) &&
            viewportRect != null && viewportRect.top === 0 ||
            this.hasLoadingOption(loadingOptions, TableLoadingOption.ROW_HEADERS);
        const noHorizontalScroll = fillBodyWithGhostCells &&
            grid.isGhostIndex(0, columnIndices.columnIndexEnd) &&
            viewportRect != null && viewportRect.left === 0 ||
            this.hasLoadingOption(loadingOptions, TableLoadingOption.COLUMN_HEADERS);

        // disable scroll for ghost cells
        const classes = classNames(Classes.TABLE_BODY, {
            [Classes.TABLE_NO_HORIZONTAL_SCROLL]: noHorizontalScroll,
            [Classes.TABLE_NO_VERTICAL_SCROLL]: noVerticalScroll,
            [Classes.TABLE_SELECTION_ENABLED]: this.isSelectionModeEnabled(RegionCardinality.CELLS),
        });
        return (
            <div
                className={classes}
                onScroll={this.handleBodyScroll}
                ref={this.setBodyRef}
            >
                <div className={Classes.TABLE_BODY_SCROLL_CLIENT} style={style}>
                    <TableBody
                        allowMultipleSelection={allowMultipleSelection}
                        cellRenderer={this.bodyCellRenderer}
                        grid={grid}
                        loading={this.hasLoadingOption(loadingOptions, TableLoadingOption.CELLS)}
                        locator={locator}
                        onFocus={this.handleFocus}
                        onSelection={this.getEnabledSelectionHandler(RegionCardinality.CELLS)}
                        renderBodyContextMenu={renderBodyContextMenu}
                        selectedRegions={selectedRegions}
                        selectedRegionTransform={selectedRegionTransform}
                        viewportRect={viewportRect}
                        {...rowIndices}
                        {...columnIndices}
                    />

                    {this.maybeRenderRegions(this.styleBodyRegion)}

                    <GuideLayer
                        className={Classes.TABLE_RESIZE_GUIDES}
                        verticalGuides={verticalGuides}
                        horizontalGuides={horizontalGuides}
                    />
                </div>

            </div>
        );
    }

    private isGuidesShowing() {
        return this.state.verticalGuides != null || this.state.horizontalGuides != null;
    }

    private isSelectionModeEnabled(selectionMode: RegionCardinality) {
        return this.props.selectionModes.indexOf(selectionMode) >= 0;
    }

    private getEnabledSelectionHandler(selectionMode: RegionCardinality) {
        if (!this.isSelectionModeEnabled(selectionMode)) {
            // If the selection mode isn't enabled, return a callback that
            // will clear the selection. For example, if row selection is
            // disabled, clicking on the row header will clear the table's
            // selection. If all selection modes are enabled, clicking on the
            // same region twice will clear the selection.
            return this.clearSelection;
        } else {
            return this.handleSelection;
        }
    }

    private invalidateGrid() {
        this.grid = null;
    }

    private validateGrid() {
        if (this.grid == null) {
            const { defaultRowHeight, defaultColumnWidth } = this.props;
            const { rowHeights, columnWidths } = this.state;
            this.grid = new Grid(
                rowHeights,
                columnWidths,
                Grid.DEFAULT_BLEED,
                defaultRowHeight,
                defaultColumnWidth,
            );
            this.invokeOnVisibleCellsChangeCallback(this.state.viewportRect);
        }
    }

    /**
     * Renders a `RegionLayer`, applying styles to the regions using the
     * supplied `IRegionStyler`. `RegionLayer` is a `PureRender` component, so
     * the `IRegionStyler` should be a new instance on every render if we
     * intend to redraw the region layer.
     */
    private maybeRenderRegions(getRegionStyle: IRegionStyler) {
        if (this.isGuidesShowing() && !this.state.isReordering) {
            // we want to show guides *and* the selection styles when reordering rows or columns
            return undefined;
        }

        const regionGroups = Regions.joinStyledRegionGroups(
            this.state.selectedRegions,
            this.props.styledRegionGroups,
            this.state.focusedCell,
        );

        return regionGroups.map((regionGroup, index) => {
            const regionStyles = regionGroup.regions.map(getRegionStyle);
            return (
                <RegionLayer
                    className={classNames(regionGroup.className)}
                    key={index}
                    regions={regionGroup.regions}
                    regionStyles={regionStyles}
                />
            );
        });
    }

    private maybeRenderCopyHotkey() {
        const { getCellClipboardData } = this.props;
        if (getCellClipboardData != null) {
            return (
                <Hotkey
                    key="copy-hotkey"
                    label="Copy selected table cells"
                    group="Table"
                    combo="mod+c"
                    onKeyDown={this.handleCopy}
                />
            );
        } else {
            return undefined;
        }
    }

    private handleFocusMoveLeft = (e: KeyboardEvent) => this.handleFocusMove(e, "left");
    private handleFocusMoveLeftInternal = (e: KeyboardEvent) => this.handleFocusMoveInternal(e, "left");
    private handleFocusMoveRight = (e: KeyboardEvent) => this.handleFocusMove(e, "right");
    private handleFocusMoveRightInternal = (e: KeyboardEvent) => this.handleFocusMoveInternal(e, "right");
    private handleFocusMoveUp = (e: KeyboardEvent) => this.handleFocusMove(e, "up");
    private handleFocusMoveUpInternal = (e: KeyboardEvent) => this.handleFocusMoveInternal(e, "up");
    private handleFocusMoveDown = (e: KeyboardEvent) => this.handleFocusMove(e, "down");
    private handleFocusMoveDownInternal = (e: KeyboardEvent) => this.handleFocusMoveInternal(e, "down");

    private maybeRenderFocusHotkeys() {
        const { enableFocus } = this.props;
        if (enableFocus != null) {
            return [
                <Hotkey
                    key="move left"
                    label="Move focus cell left"
                    group="Table"
                    combo="left"
                    onKeyDown={this.handleFocusMoveLeft}
                />,
                <Hotkey
                    key="move right"
                    label="Move focus cell right"
                    group="Table"
                    combo="right"
                    onKeyDown={this.handleFocusMoveRight}
                />,
                <Hotkey
                    key="move up"
                    label="Move focus cell up"
                    group="Table"
                    combo="up"
                    onKeyDown={this.handleFocusMoveUp}
                />,
                <Hotkey
                    key="move down"
                    label="Move focus cell down"
                    group="Table"
                    combo="down"
                    onKeyDown={this.handleFocusMoveDown}
                />,
                <Hotkey
                    key="move tab"
                    label="Move focus cell tab"
                    group="Table"
                    combo="tab"
                    onKeyDown={this.handleFocusMoveRightInternal}
                />,
                <Hotkey
                    key="move shift-tab"
                    label="Move focus cell shift tab"
                    group="Table"
                    combo="shift+tab"
                    onKeyDown={this.handleFocusMoveLeftInternal}
                />,
                <Hotkey
                    key="move enter"
                    label="Move focus cell enter"
                    group="Table"
                    combo="enter"
                    onKeyDown={this.handleFocusMoveDownInternal}
                />,
                <Hotkey
                    key="move shift-enter"
                    label="Move focus cell shift enter"
                    group="Table"
                    combo="shift+enter"
                    onKeyDown={this.handleFocusMoveUpInternal}
                />,
            ];
        } else {
            return [];
        }
    }

    private maybeRenderSelectAllHotkey() {
        if (this.isSelectionModeEnabled(RegionCardinality.FULL_TABLE)) {
            return (
                <Hotkey
                    key="select-all-hotkey"
                    label="Select all"
                    group="Table"
                    combo="mod+a"
                    onKeyDown={this.handleSelectAllHotkey}
                />
            );
        } else {
            return undefined;
        }
    }

    private styleBodyRegion = (region: IRegion): React.CSSProperties => {
        const cardinality = Regions.getRegionCardinality(region);
        const style = this.grid.getRegionStyle(region);
        switch (cardinality) {
            case RegionCardinality.CELLS:
                return style;

            case RegionCardinality.FULL_COLUMNS:
                style.top = "-1px";
                return style;

            case RegionCardinality.FULL_ROWS:
                style.left = "-1px";
                return style;

            case RegionCardinality.FULL_TABLE:
                style.left = "-1px";
                style.top = "-1px";
                return style;

            default:
                return { display: "none" };
        }
    }

    private styleMenuRegion = (region: IRegion): React.CSSProperties => {
        const { grid } = this;
        const { viewportRect } = this.state;
        if (viewportRect == null) {
            return {};
        }
        const cardinality = Regions.getRegionCardinality(region);
        const style = grid.getRegionStyle(region);

        switch (cardinality) {
            case RegionCardinality.FULL_TABLE:
                style.right = "0px";
                style.bottom = "0px";
                style.top = "0px";
                style.left = "0px";
                style.borderBottom = "none";
                style.borderRight = "none";
                return style;

            default:
                return { display: "none" };
        }
    }

    private styleColumnHeaderRegion = (region: IRegion): React.CSSProperties => {
        const { grid } = this;
        const { viewportRect } = this.state;
        if (viewportRect == null) {
            return {};
        }
        const cardinality = Regions.getRegionCardinality(region);
        const style = grid.getRegionStyle(region);

        switch (cardinality) {
            case RegionCardinality.FULL_TABLE:
                style.left = "-1px";
                style.borderLeft = "none";
                style.bottom = "-1px";
                style.transform = `translate3d(${-viewportRect.left}px, 0, 0)`;
                return style;
            case RegionCardinality.FULL_COLUMNS:
                style.bottom = "-1px";
                style.transform = `translate3d(${-viewportRect.left}px, 0, 0)`;
                return style;

            default:
                return { display: "none" };
        }
    }

    private styleRowHeaderRegion = (region: IRegion): React.CSSProperties => {
        const { grid } = this;
        const { viewportRect } = this.state;
        if (viewportRect == null) {
            return {};
        }
        const cardinality = Regions.getRegionCardinality(region);
        const style = grid.getRegionStyle(region);
        switch (cardinality) {
            case RegionCardinality.FULL_TABLE:
                style.top = "-1px";
                style.borderTop = "none";
                style.right = "-1px";
                style.transform = `translate3d(0, ${-viewportRect.top}px, 0)`;
                return style;
            case RegionCardinality.FULL_ROWS:
                style.right = "-1px";
                style.transform = `translate3d(0, ${-viewportRect.top}px, 0)`;
                return style;

            default:
                return { display: "none" };
        }
    }

    private handleColumnWidthChanged = (columnIndex: number, width: number) => {
        const selectedRegions = this.state.selectedRegions;
        const columnWidths = this.state.columnWidths.slice();

        if (Regions.hasFullTable(selectedRegions)) {
            for (let col = 0; col < columnWidths.length; col++) {
                columnWidths[col] = width;
            }
        }
        if (Regions.hasFullColumn(selectedRegions, columnIndex)) {
            Regions.eachUniqueFullColumn(selectedRegions, (col: number) => {
                columnWidths[col] = width;
            });
        } else {
            columnWidths[columnIndex] = width;
        }

        this.invalidateGrid();
        this.setState({ columnWidths });

        const { onColumnWidthChanged } = this.props;
        if (onColumnWidthChanged != null) {
            onColumnWidthChanged(columnIndex, width);
        }
    }

    private handleRowHeightChanged = (rowIndex: number, height: number) => {
        const selectedRegions = this.state.selectedRegions;
        const rowHeights = this.state.rowHeights.slice();

        if (Regions.hasFullTable(selectedRegions)) {
            for (let row = 0; row < rowHeights.length; row++) {
                rowHeights[row] = height;
            }
        }
        if (Regions.hasFullRow(selectedRegions, rowIndex)) {
            Regions.eachUniqueFullRow(selectedRegions, (row: number) => {
                rowHeights[row] = height;
            });
        } else {
            rowHeights[rowIndex] = height;
        }

        this.invalidateGrid();
        this.setState({ rowHeights });

        const { onRowHeightChanged } = this.props;
        if (onRowHeightChanged != null) {
            onRowHeightChanged(rowIndex, height);
        }
    }

    private handleRootScroll = (_event: React.UIEvent<HTMLElement>) => {
        // Bug #211 - Native browser text selection events can cause the root
        // element to scroll even though it has a overflow:hidden style. The
        // only viable solution to this is to unscroll the element after the
        // browser scrolls it.
        if (this.rootTableElement != null) {
            this.rootTableElement.scrollLeft = 0;
            this.rootTableElement.scrollTop = 0;
        }
    }

    private handleBodyScroll = (event: React.UIEvent<HTMLElement>) => {
        // Prevent the event from propagating to avoid a resize event on the
        // resize sensor.
        event.stopPropagation();

        if (this.locator != null && !this.state.isLayoutLocked) {
            const viewportRect = this.locator.getViewportRect();
            this.updateViewportRect(viewportRect);
        }
    }

    private handleColumnResizeGuide = (verticalGuides: number[]) => {
        this.setState({ verticalGuides } as ITableState);
    }

    private handleRowResizeGuide = (horizontalGuides: number[]) => {
        this.setState({ horizontalGuides } as ITableState);
    }

    private clearSelection = (_selectedRegions: IRegion[]) => {
        this.handleSelection([]);
    }

    // no good way to call arrow-key keyboard events from tests
    /* istanbul ignore next */
    private handleFocusMove = (e: KeyboardEvent, direction: "up" | "down" | "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();

        const { focusedCell } = this.state;
        if (focusedCell == null) {
            // halt early if we have a selectedRegionTransform or something else in play that nixes
            // the focused cell.
            return;
        }

        const newFocusedCell = { col: focusedCell.col, row: focusedCell.row, focusSelectionIndex: 0 };
        const { grid } = this;

        switch (direction) {
            case "up":
                newFocusedCell.row -= 1;
                break;
            case "down":
                newFocusedCell.row += 1;
                break;
            case "left":
                newFocusedCell.col -= 1;
                break;
            case "right":
                newFocusedCell.col += 1;
                break;
            default:
                break;
        }

        if (newFocusedCell.row < 0 || newFocusedCell.row >= grid.numRows ||
            newFocusedCell.col < 0 || newFocusedCell.col >= grid.numCols) {
            return;
        }

        // change selection to match new focus cell location
        const newSelectionRegions = [Regions.cell(newFocusedCell.row, newFocusedCell.col)];
        this.handleSelection(newSelectionRegions);
        this.handleFocus(newFocusedCell);

        // keep the focused cell in view
        this.scrollBodyToFocusedCell(newFocusedCell);
    }

    // no good way to call arrow-key keyboard events from tests
    /* istanbul ignore next */
    private handleFocusMoveInternal = (e: KeyboardEvent, direction: "up" | "down" | "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();

        const { focusedCell, selectedRegions } = this.state;
        const { grid } = this;

        if (focusedCell == null) {
            // halt early if we have a selectedRegionTransform or something else in play that nixes
            // the focused cell.
            return;
        }

        let newFocusedCell = {
            col: focusedCell.col,
            focusSelectionIndex: focusedCell.focusSelectionIndex,
            row: focusedCell.row,
        };

        // if we're not in any particular focus cell region, and one exists, go to the first cell of the first one
        if (focusedCell.focusSelectionIndex == null && selectedRegions.length > 0) {
            const focusCellRegion = Regions.getCellRegionFromRegion(
                selectedRegions[0],
                grid.numRows,
                grid.numCols,
            );

            newFocusedCell = {
                col: focusCellRegion.cols[0],
                focusSelectionIndex: 0,
                row:  focusCellRegion.rows[0],
            };
        } else {
            if (selectedRegions.length === 0) {
                this.handleFocusMove(e, direction);
                return;
            }

            const focusCellRegion = Regions.getCellRegionFromRegion(
                selectedRegions[focusedCell.focusSelectionIndex],
                grid.numRows,
                grid.numCols,
            );

            if (focusCellRegion.cols[0] === focusCellRegion.cols[1]
                && focusCellRegion.rows[0] === focusCellRegion.rows[1]
                && selectedRegions.length === 1) {

                this.handleFocusMove(e, direction);
                return;
            }

            switch (direction) {
                case "up":
                    newFocusedCell = this.moveFocusCell("row", "col", true, newFocusedCell, focusCellRegion);
                    break;
                case "left":
                    newFocusedCell = this.moveFocusCell("col", "row", true, newFocusedCell, focusCellRegion);
                    break;
                case "down":
                    newFocusedCell = this.moveFocusCell("row", "col", false, newFocusedCell, focusCellRegion);
                    break;
                case "right":
                    newFocusedCell = this.moveFocusCell("col", "row", false, newFocusedCell, focusCellRegion);
                    break;
                default:
                    break;
            }
        }

        if (newFocusedCell.row < 0 || newFocusedCell.row >= grid.numRows ||
            newFocusedCell.col < 0 || newFocusedCell.col >= grid.numCols) {
            return;
        }

        this.handleFocus(newFocusedCell);

        // keep the focused cell in view
        this.scrollBodyToFocusedCell(newFocusedCell);
    }

    private scrollBodyToFocusedCell = (focusedCell: IFocusedCellCoordinates) => {
        const { row, col } = focusedCell;
        const { viewportRect } = this.state;

        // sort keys in normal CSS position order (per the trusty TRBL/"trouble" acronym)
        // tslint:disable:object-literal-sort-keys
        const viewportBounds = {
            top: viewportRect.top,
            right: viewportRect.left + viewportRect.width,
            bottom: viewportRect.top + viewportRect.height,
            left: viewportRect.left,
        };
        const focusedCellBounds = {
            top: this.grid.getCumulativeHeightBefore(row),
            right: this.grid.getCumulativeWidthAt(col),
            bottom: this.grid.getCumulativeHeightAt(row),
            left: this.grid.getCumulativeWidthBefore(col),
        };
        // tslint:enable:object-literal-sort-keys

        const focusedCellWidth = focusedCellBounds.right - focusedCellBounds.left;
        const focusedCellHeight = focusedCellBounds.bottom - focusedCellBounds.top;

        const isFocusedCellWiderThanViewport = focusedCellWidth > viewportRect.width;
        const isFocusedCellTallerThanViewport = focusedCellHeight > viewportRect.height;

        let nextScrollTop = viewportRect.top;
        let nextScrollLeft = viewportRect.left;

        // keep the top end of an overly tall focused cell in view when moving left and right
        // (without this OR check, the body seesaws to fit the top end, then the bottom end, etc.)
        if (focusedCellBounds.top < viewportBounds.top || isFocusedCellTallerThanViewport) {
            // scroll up (minus one pixel to avoid clipping the focused-cell border)
            nextScrollTop = Math.max(0, focusedCellBounds.top - 1);
        } else if (focusedCellBounds.bottom > viewportBounds.bottom) {
            // scroll down
            const scrollDelta = focusedCellBounds.bottom - viewportBounds.bottom;
            nextScrollTop = viewportBounds.top + scrollDelta;
        }

        // keep the left end of an overly wide focused cell in view when moving up and down
        if (focusedCellBounds.left < viewportBounds.left || isFocusedCellWiderThanViewport) {
            // scroll left (again minus one additional pixel)
            nextScrollLeft = Math.max(0, focusedCellBounds.left - 1);
        } else if (focusedCellBounds.right > viewportBounds.right) {
            // scroll right
            const scrollDelta = focusedCellBounds.right - viewportBounds.right;
            nextScrollLeft = viewportBounds.left + scrollDelta;
        }

        this.syncViewportPosition(nextScrollLeft, nextScrollTop);
    }

    private syncViewportPosition(nextScrollLeft: number, nextScrollTop: number) {
        const { viewportRect } = this.state;

        const didScrollTopChange = nextScrollTop !== viewportRect.top;
        const didScrollLeftChange = nextScrollLeft !== viewportRect.left;

        if (didScrollTopChange || didScrollLeftChange) {
            // we need to modify the body element explicitly for the viewport to shift
            if (didScrollTopChange) {
                this.bodyElement.scrollTop = nextScrollTop;
            }
            if (didScrollLeftChange) {
                this.bodyElement.scrollLeft = nextScrollLeft;
            }

            const nextViewportRect = new Rect(
                nextScrollLeft,
                nextScrollTop,
                viewportRect.width,
                viewportRect.height,
            );
            this.updateViewportRect(nextViewportRect);
        }
    }

    private handleFocus = (focusedCell: IFocusedCellCoordinates) => {
        if (!this.props.enableFocus) {
            // don't set focus state if focus is not allowed
            return;
        }

        // only set focused cell state if not specified in props
        if (this.props.focusedCell == null) {
            this.setState({ focusedCell } as ITableState);
        }

        BlueprintUtils.safeInvoke(this.props.onFocus, focusedCell);
    }

    private handleSelection = (selectedRegions: IRegion[]) => {
        // only set selectedRegions state if not specified in props
        if (this.props.selectedRegions == null) {
            this.setState({ selectedRegions } as ITableState);
        }

        const { onSelection } = this.props;
        if (onSelection != null) {
            onSelection(selectedRegions);
        }
    }

    private handleColumnsReordering = (oldIndex: number, newIndex: number, length: number) => {
        const guideIndex = Utils.reorderedIndexToGuideIndex(oldIndex, newIndex, length);
        const leftOffset = this.grid.getCumulativeWidthBefore(guideIndex);
        this.setState({ isReordering: true, verticalGuides: [leftOffset] } as ITableState);
    }

    private handleColumnsReordered = (oldIndex: number, newIndex: number, length: number) => {
        this.setState({ isReordering: false, verticalGuides: undefined } as ITableState);
        BlueprintUtils.safeInvoke(this.props.onColumnsReordered, oldIndex, newIndex, length);
    }

    private handleRowsReordering = (oldIndex: number, newIndex: number, length: number) => {
        const guideIndex = Utils.reorderedIndexToGuideIndex(oldIndex, newIndex, length);
        const topOffset = this.grid.getCumulativeHeightBefore(guideIndex);
        this.setState({ isReordering: true, horizontalGuides: [topOffset] } as ITableState);
    }

    private handleRowsReordered = (oldIndex: number, newIndex: number, length: number) => {
        this.setState({ isReordering: false, horizontalGuides: undefined } as ITableState);
        BlueprintUtils.safeInvoke(this.props.onRowsReordered, oldIndex, newIndex, length);
    }

    private handleLayoutLock = (isLayoutLocked = false) => {
        this.setState({ isLayoutLocked });
    }

    private hasLoadingOption = (loadingOptions: string[], loadingOption: string) => {
        if (loadingOptions == null) {
            return undefined;
        }
        return loadingOptions.indexOf(loadingOption) >= 0;
    }

    private updateViewportRect = (nextViewportRect: Rect) => {
        this.setState({ viewportRect: nextViewportRect });
        this.invokeOnVisibleCellsChangeCallback(nextViewportRect);
    }

    private invokeOnVisibleCellsChangeCallback(viewportRect: Rect) {
        const columnIndices = this.grid.getColumnIndicesInRect(viewportRect);
        const rowIndices = this.grid.getRowIndicesInRect(viewportRect);
        BlueprintUtils.safeInvoke(this.props.onVisibleCellsChange, rowIndices, columnIndices);
    }

    private setBodyRef = (ref: HTMLElement) => this.bodyElement = ref;
    private setMenuRef = (ref: HTMLElement) => this.menuElement = ref;
    private setRootTableRef = (ref: HTMLElement) => this.rootTableElement = ref;
    private setRowHeaderRef = (ref: HTMLElement) => this.rowHeaderElement = ref;
}
