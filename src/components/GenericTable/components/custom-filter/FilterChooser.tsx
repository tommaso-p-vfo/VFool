import { Form } from "react-bootstrap"
import GenericButton, { type GenericButtonConfig } from "../../../GenericButton"
import GenericModal from "../../../modals/GenericModal"
import { CustomFilterForm } from "./CustomFilterForm"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTableContext } from "../../hooks/useTableContext"
import { AppPathHelper } from "../../../../../core/helpers/AppPathHelper"
import { IdsVariant } from "../../../../../types/system/IdsVariant"
import { IdsColor } from "../../../../../types/system/IdsColor"
import { FaBookmark, FaCheckCircle, FaPencilAlt, FaSave, FaTimes } from "react-icons/fa"
import useTranslations from "../../../../../locales/hooks/useTranslations"
import { UiHelper } from "../../../../../core/helpers/UiHelper"
import { FaRegBookmark } from "react-icons/fa6"
import type { UserCustomFilter } from "../../../../../types/dto/UserCustomFilter"

export const FilterChooser = ({ onFilterApplied }: { onFilterApplied?: () => void}) => {

    const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);

    const t = useTranslations();

    const tableContext = useTableContext();
    const { cols, customFilters, activeFilter, existFilter, addFilter, updateFilter, removeFilter, applyFilter, isFilterApplied } = tableContext.customFilterHandler;

    const customFilterFormRef = useRef(null);
    const [selectedFilter, ] = useState({});

    const [notSavedFilter, setNotSavedFilter] = useState<UserCustomFilter>({});

    const filters = useMemo(() => {

        let cfs = customFilters ?? [];
        let af = activeFilter;

        if (!existFilter(af?.id) && af?.id != -1) {
            //salvo il filtro nello state per la gestione del form
            setNotSavedFilter(af);

            //includo il filtro non salvato nella lista
            return [af, ...cfs];
        }


        return customFilters;

    }, [activeFilter, customFilters]);

    const notSavedFilterformRef = useRef(null);
    const [validated, setValidated] = useState(false);

    return (<>
        <div className="p-2 ids-filter-chooser">
            <div className="row small fst-italic mb-2">
                <div className="col-1">Attiva</div>
                <div className="col">Nome filtro</div>
                <div className="col text-end">Predefinito {t.common.buttons.delete}</div>
            </div>

            {filters?.map((filter, idx) => {

                let isActive = isFilterApplied(filter);

                return (

                    <div className="row mb-1" key={idx}>
                        <div className="col-1">
                            {!isActive && <Form.Check
                                title="Attiva filtro"
                                className="me-4 cursor-pointer"
                                type="radio"
                                name="defaultFilter"
                                checked={isActive}
                                onChange={() => { applyFilter(filter.id); setTimeout(() => { 

                                    if (onFilterApplied && typeof(onFilterApplied) == 'function') {
                                        onFilterApplied();
                                    }

                                 }, 500) }}
                            />}
                            {isActive && <FaCheckCircle title="Filtro attivo" color={UiHelper.getColor(IdsColor.PRIMARY).color} /> }
                        </div>
                        <div className="col">
                            {!filter?._isTemporary && <Form.Text>{filter.name}</Form.Text>}
                            {filter?._isTemporary && 
                            <Form ref={notSavedFilterformRef} noValidate validated={validated}>
                                <Form.Group controlId='nsFilterName' >
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
                        </div>
                        <div className="col d-flex justify-content-end">
                            <div className="d-flex gap-1">

                                {filter?._isTemporary && <GenericButton
                                    onClick={async () => { 
                                        let isValid = notSavedFilterformRef.current?.checkValidity() ?? false;
                                        setValidated(!isValid);

                                        if (!isValid) return;

                                        await addFilter({...notSavedFilter, id: undefined});

                                    }}
                                    readableName={"Salva filtro"}
                                    className="no-border"
                                    tooltip="Salva filtro"
                                    buttonConfig={{
                                        variant: IdsVariant.LIGHT,
                                        color: IdsColor.GREEN,
                                        icon: <FaSave />
                                    } as GenericButtonConfig}
                                />}

                                {!filter?.isDefault && !filter?._isTemporary && <GenericButton
                                    onClick={() => { updateFilter({ ...filter, isDefault: true } as UserCustomFilter) }}
                                    readableName={"Rendi predefinito"}
                                    className="no-border"
                                    tooltip="Rendi predefinito"
                                    buttonConfig={{
                                        variant: IdsVariant.LIGHT,
                                        color: IdsColor.GRAY,
                                        icon: <FaRegBookmark />
                                    } as GenericButtonConfig}
                                />}
                                {filter?.isDefault &&
                                    <FaBookmark title="Filtro predefinito" className="m-2 me-3 cursor-pointer" color={UiHelper.getColor(IdsColor.YELLOW).color} 
                                        onClick={() => { updateFilter({ ...filter, isDefault: false } as UserCustomFilter) }}
                                    />}
                                
                                <GenericButton 
                                    onClick={() => { removeFilter(filter) } } 
                                    readableName={"Elimina"} 
                                    className="no-border"
                                    tooltip="Elimina filtro"
                                    buttonConfig={{
                                        variant: IdsVariant.LIGHT,
                                        color: IdsColor.RED,
                                        icon: <FaTimes />
                                    } as GenericButtonConfig}>
                                </GenericButton>
                            </div>
                        </div>
                        <hr className="mb-2 mt-1" />
                    </div>               
                )

                })}

        </div>

        <GenericModal 
            title={"Mod. filtro"} 
            // size="xl"
            shouldOpenModal={shouldOpenModal} 
            onCloseModal={() => { setShouldOpenModal(false); }} 
            children={<CustomFilterForm 
                ref={customFilterFormRef} 
                currentFilter={selectedFilter} 
                cols={cols} 
                translationPath={AppPathHelper.build(tableContext.domain?.agGridDomain, 'columns')} 
            />}
            actions={[
                {
                    name: 'Modifica',
                    onClick: () => {
                        customFilterFormRef.current?.buildFilter();
                    }
                }
            ]} 
        />
    </>)

}
