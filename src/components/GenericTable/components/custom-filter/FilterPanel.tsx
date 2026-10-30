import { useCallback, useEffect, useRef, useState } from "react";
import type { UserCustomFilter } from "../../../../../types/dto/UserCustomFilter";
import { useTableContext } from "../../hooks/useTableContext";
import { Form } from "react-bootstrap";
import GenericButton, { type GenericButtonConfig } from "../../../GenericButton";
import { IdsVariant } from "../../../../../types/system/IdsVariant";
import { IdsColor } from "../../../../../types/system/IdsColor";
import { FaPlusCircle, FaSave } from "react-icons/fa";

export const FilterPanel = ({ filter }: { filter?: UserCustomFilter }) => {

    const tableContext = useTableContext();
    const { addFilter, updateFilter, activeFilter } = tableContext.customFilterHandler;

    const notSavedFilterformRef = useRef(null);
    const [notSavedFilter, setNotSavedFilter] = useState<UserCustomFilter>({});
    const [validated, setValidated] = useState(false);

    const saveFilter = useCallback(async () => {
        let isValid = notSavedFilterformRef.current?.checkValidity() ?? false;
        setValidated(!isValid);

        if (!isValid) return;

        await addFilter({ ...notSavedFilter, id: undefined });

    }, [notSavedFilter]);

    useEffect(() => {

        if(activeFilter) {
            setNotSavedFilter(activeFilter);
        } else if (filter){
            setNotSavedFilter(filter);
        }

        setValidated(false);

    }, [filter]);

    // if (filter?.id == -1 && !filter?._isNew) return;

    return (<>

        <div className="ids-not-saved-filter d-flex align-items-center ms-0">

            <div className="ids-not-saved-filter-name ids-text-truncate" title={`Filtro attivo: ${notSavedFilter?.name ?? 'Nessuno'}`} >
                {!notSavedFilter?._isNew && 
                    <Form.Text>
                        <span className="me-1">Filtro attivo:</span>
                        <span className="fw-bold">{notSavedFilter?.name ?? (notSavedFilter?._isCandidateForNew ? 'Non salvato' : 'Nessuno')}</span>
                        <span className="ms-1 small fst-italic">{notSavedFilter?._isModified && '(modificato)'}</span>
                    </Form.Text>}
                {notSavedFilter?._isNew &&
                    <Form ref={notSavedFilterformRef} noValidate validated={validated}>
                        <Form.Group controlId='nsFilterName' className="ids-not-saved-filter-input" >
                            <Form.Control
                                value={notSavedFilter.name}
                                required
                                onChange={(e) => {
                                    setNotSavedFilter({ ...notSavedFilter, name: e.target.value });
                                }} placeholder="Non salvato - Inserisci nome"
                            />
                            <Form.Control.Feedback type="invalid">
                                Inserire un nome
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Form>
                }
                {!notSavedFilter?._isNew && notSavedFilter?._isCandidateForNew && !notSavedFilter?._isModified && <GenericButton
                    onClick={async () => {

                        setNotSavedFilter(prev => ({ ...prev, _isNew: true, name: '' }))

                    }}
                    readableName={"Crea nuovo"}
                    className="no-border m-0 px-1"
                    tooltip="Crea nuovo filtro"
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.GREEN,
                        icon: <FaPlusCircle />
                    } as GenericButtonConfig}
                />}
            </div>

            <div className="">
                {!notSavedFilter?._isNew && notSavedFilter?._isModified && <GenericButton
                    onClick={() => { updateFilter(notSavedFilter) }}
                    readableName={"Aggiorna"}
                    className="no-border m-0 px-1"
                    tooltip="Aggiorna il filtro"
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.YELLOW,
                        icon: <FaSave /> // <FaPencilAlt />
                    } as GenericButtonConfig}>
                </GenericButton>}

                {!notSavedFilter?._isCandidateForNew && !notSavedFilter?._isNew && notSavedFilter?._isModified && <GenericButton
                    onClick={async () => {

                        setNotSavedFilter(prev => ({ ...prev, _isNew: true, name: '' }))

                    }}
                    readableName={"Crea nuovo"}
                    className="no-border m-0 px-1"
                    tooltip="Crea nuovo filtro"
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.GREEN,
                        icon: <FaPlusCircle />
                    } as GenericButtonConfig}
                />}

                {notSavedFilter?._isNew && <GenericButton
                    onClick={() => { saveFilter() }}
                    readableName={"Salva"}
                    className="no-border"
                    tooltip="Salva filtro"
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.GREEN,
                        icon: <FaSave /> // <FaPencilAlt />
                    } as GenericButtonConfig}>
                </GenericButton>}
            </div>


        </div>


        {/* <span>{filter?.id == -2 ? 'Filtro temporaneo - Non salvato' : filter?.name}</span>
        {filter?._isModified && 
            <GenericButton 
                onClick={() => { } } 
                    readableName={"Modifica"} 
                    className="no-border"
                    tooltip="Modifica filtro"
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.YELLOW,
                        icon: <FaPencilAlt />
                    } as GenericButtonConfig}>
            </GenericButton>
        } */}
    </>)

}