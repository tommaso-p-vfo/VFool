// FilterRow.tsx
import { forwardRef, useImperativeHandle, useState } from "react";
import { Form } from "react-bootstrap";
import type { CellClickedEvent, ColDef, ColumnState, GridApi, ITextFilterParams } from 'ag-grid-community';
import { TableHelper } from "../../../helpers/TableHelper";
import { TranslationHelper } from "../../../../../../locales/helpers/TranslationHelper";
import { AppPathHelper } from "../../../../../../core/helpers/AppPathHelper";
import { getFilterTypeLabel } from "../../../constants/agGridConstants";
import { FaTimes } from "react-icons/fa";
import { IdsColor } from "../../../../../../types/system/IdsColor";
import { IdsVariant } from "../../../../../../types/system/IdsVariant";
import GenericButton from "../../../../GenericButton";
import useTranslations from "../../../../../../locales/hooks/useTranslations";

export type FilterRowHandle = {
    getFilterValue: () => FilterRowValue | null;
    validate: () => boolean;
};

export type FilterRowValue = {
    colId: string;
    fstOperator: string;
    fstOperand: string | number;
    fstExtraOperand?: string | number;
    logicOperator?: 'and' | 'or';
    sndOperator?: string;
    sndOperand?: string | number;
    sndExtraOperand?: string | number;
};

export const FilterRow = forwardRef<FilterRowHandle, { col: ColDef, translationPath?: string }>(
    ({ col, translationPath }, ref) => {

        const t = useTranslations();

        const [enabled, setEnabled] = useState(false);

        const filterOptions = TableHelper.getFilterOptions(col.filter);
        
        //values
        const [fstOperator, setFstOperator] = useState<string>();
        const [fstOperand, setFstOperand] = useState<string|number>();
        const [fstExtraOperand, setFstExtraOperand] = useState<string|number>();
        
        const [logicOperator, setLogicOperator] = useState<'and' | 'or' | undefined>('and');
        
        const [sndOperator, setSndOperator] = useState<string>();
        const [sndOperand, setSndOperand] = useState<string | number>();
        const [sndExtraOperand, setSndExtraOperand] = useState<string | number>();
        
        //show logic
        const [loKey, setLoKey] = useState(0);
        const [enableFstOperator, setEnableFstOperator] = useState<boolean>(false);
        const [enableFstOperand, setEnableFstOperand] = useState<boolean>(false);
        const [showFstExtraOperand, setShowFstExtraOperand] = useState<boolean>(false); 

        const [showLogicOperator, setShowLogicOperator] = useState<boolean>(false);
        const [showSecondOperandGroup, setShowSecondOperandGroup] = useState<boolean>(false); 

        const [enableSndOperand, setEnableSndOperand] = useState<boolean>(false);
        const [showSndExtraOperand, setShowSndExtraOperand] = useState<boolean>(false);
        
        const resetAll = () => {
            setFstOperator('Seleziona');
            resetFstGroup();
            resetSndGroup();
        }

        const resetFstGroup = () => {
            setEnableFstOperand(false);
            setFstOperand('');
            setShowFstExtraOperand(false);
            setFstExtraOperand('');
            setLogicOperator(undefined);
            setLoKey(p => p+1);
            setShowLogicOperator(false);
            setShowSecondOperandGroup(false);
        }

        const resetSndGroup = () => {
            setSndOperator('');
            setEnableSndOperand(false);
            setSndOperand('');
            setShowSndExtraOperand(false);
            setSndExtraOperand('');
        }

        const onCheckChange = (e) => {
            let checked = e.target.checked;
            setEnableFstOperator(checked);
            if(!checked) resetAll();
        }

        const onSelectFirstOperatorChange = (e) => {
            let value = e.target.value;
            let _enableFields = value != 'Seleziona';
            
            setFstOperator(value);
            
            setEnableFstOperand(_enableFields);
            setShowFstExtraOperand(_enableFields && value == 'Tra');

            if (value != 'Tra') setFstExtraOperand('');

            setShowLogicOperator(_enableFields);

            if(!_enableFields) {
                setLogicOperator(undefined);
                setShowSecondOperandGroup(_enableFields);
            }
        }

        const onFstOperandChange = (e) => {
            let value = e.target.value;
            setFstOperand(value);
        }

        const onFstExtraOperandChange = (e) => {
            let value = e.target.value;
            setFstExtraOperand(value);
        }

        const onSndOperandChange = (e) => {
            let value = e.target.value;
            setSndOperand(value);
        }

        const onSndExtraOperandChange = (e) => {
            let value = e.target.value;
            setSndExtraOperand(value);
        }

        const onSelectSecondOperatorChange = (e) => {
            let value = e.target.value;
            let _enableFields = value != 'Seleziona';
            setSndOperator(value);
            setEnableSndOperand(_enableFields);
            setShowSndExtraOperand(_enableFields && value == 'Tra');

            if (value != 'Tra') setSndExtraOperand('');
        }

        const onLogicOperatorChange = (e) => {
            let value = e.target.value;
            setLogicOperator(value);
            let _enableFields = value != null || value != undefined;
            setShowSecondOperandGroup(_enableFields);
        }

        useImperativeHandle(ref, () => ({
            validate,
            getFilterValue,
        }));

        const validate = (): boolean => {
            if (!enabled) return true; // riga disabilitata = valida per default

            if (!fstOperator || fstOperator === 'Seleziona') return false;
            if (!fstOperand && fstOperand !== 0) return false;
            if (showFstExtraOperand && !fstExtraOperand && fstExtraOperand !== 0) return false;

            if (showSecondOperandGroup) {
                if (!sndOperator || sndOperator === 'Seleziona') return false;
                if (!sndOperand && sndOperand !== 0) return false;
                if (showSndExtraOperand && !sndExtraOperand && sndExtraOperand !== 0) return false;
            }

            return true;
        };

        const getFilterValue = (): FilterRowValue | null => {
            if (!enabled) return null;
            return {
                colId: col.colId!,
                fstOperator,
                fstOperand,
                ...(showFstExtraOperand && { fstExtraOperand }),
                ...(showLogicOperator && { logicOperator }),
                ...(showSecondOperandGroup && {
                    sndOperator,
                    sndOperand,
                    ...(showSndExtraOperand && { sndExtraOperand }),
                }),
            };
        };

        // ... resto dei handler identici a prima, solo spostati qui
        return <div className="ids-custom-filter-row">

            <div className="row my-1">
                <div className="col-3">
                    <div className="d-flex gap-1">
                        <Form.Check
                            onChange={onCheckChange}
                        />
                        <span className="small fst-italic ids-text-truncate" title={TranslationHelper.getProperty(t, AppPathHelper.build(translationPath, col.colId))}>
                            {TranslationHelper.getProperty(t, AppPathHelper.build(translationPath, col.colId))}
                        </span>
                    </div>
                </div>
                <div className="col-8">

                    <div className="row">
                        <div className="d-flex gap-2">
                            <Form.Select className="w-25" value={fstOperator} disabled={!enableFstOperator} onChange={onSelectFirstOperatorChange} aria-label="Default select example" size="sm">
                                <option>Seleziona</option>
                                {filterOptions.map(o => <option value={o}>{getFilterTypeLabel(o)}</option>)}
                            </Form.Select>
                            <Form.Control required className="w-50" value={fstOperand} disabled={!enableFstOperand} onChange={onFstOperandChange} />
                            {showFstExtraOperand && <span className="d-flex small">
                                <span className="mt-2 me-1">a</span>
                                <Form.Control required value={fstExtraOperand} className="w-50" onChange={onFstExtraOperandChange} />
                            </span>}

                            {showLogicOperator && <span key={loKey} className="d-flex small gap-1 align-items-center">
                                <Form.Check
                                    defaultChecked={undefined}
                                    className="cursor-pointer"
                                    type={'radio'}
                                    name="logic-operand"
                                    label={'E'}
                                    id={`logic-operand-and`}
                                    onChange={onLogicOperatorChange}
                                    value={logicOperator}
                                />
                                <Form.Check
                                    defaultChecked={undefined}
                                    className="cursor-pointer"
                                    type={'radio'}
                                    name="logic-operand"
                                    label={'O'}
                                    id={`logic-operand-or`}
                                    onChange={onLogicOperatorChange}
                                    value={logicOperator}
                                />
                            </span>}



                        </div>
                    </div>
                    <div className="row ms-0 mt-1 gap-2">
                        {showSecondOperandGroup && <>
                            <Form.Select className="w-25" value={sndOperator} onChange={onSelectSecondOperatorChange} aria-label="Default select example" size="sm">
                                <option>Seleziona</option>
                                {filterOptions.map(o => <option value={o}>{getFilterTypeLabel(o)}</option>)}
                            </Form.Select>
                            <Form.Control required className="w-50" value={sndOperand} disabled={!enableSndOperand} onChange={onSndOperandChange} />
                            {showSndExtraOperand && <div className="d-flex small">
                                <span className="mt-2 me-1">a</span>
                                <Form.Control required className="w-50" value={sndExtraOperand} onChange={onSndExtraOperandChange} />
                            </div>}
                            <hr />
                        </>}
                    </div>


                </div>
                <div className="col-1">
                    <GenericButton
                        className="no-border"
                        disabled={!enableFstOperator}
                        buttonConfig={{
                            icon: <FaTimes />,
                            color: IdsColor.RED,
                            variant: IdsVariant.LIGHT
                        }}
                        tooltip="Ripristina il campo"
                        readableName={"Ripristina il campo"}
                        onClick={resetAll}
                    />
                </div>
            </div>
            {/* <hr className="m-0 p-0 mb-2"/> */}


        </div>;
    }
);