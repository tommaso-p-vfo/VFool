import { useEffect, useRef, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { Badge } from 'react-bootstrap';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/agGridConstants';
import Combobox from '../../../forms/combobox/Combobox';
import { AppPathHelper } from '../../../../../core/helpers/AppPathHelper';
import DOMAIN, { SUBDOMAIN } from '../../../../../core/constants/domains';
import type { ComboboxOptionConfig } from '../../../../../types/system/ComboboxOptionConfig';
import TableCombobox from './components/TableCombobox';
import { useAppContext } from '../../../../../core/context/hooks/useAppContext';
import type ApiRequest from '../../../../../types/system/api/ApiRequest';
import { SERVICE_ENDPOINT } from '../../../../../core/service-locator/constants/locatorPath';
import { useTableContext } from '../../hooks/useTableContext';
import useTranslations from '../../../../../locales/hooks/useTranslations';

// /**
//  *
//  * Header Component
//  *
//  * @param props
//  * @returns
//  */
// const BoxedComboboxHeader = ({ displayName }: CustomHeaderProps) => {
//     return (
//         <>
//             <Pipette className='hds-header-icon' />
//             <span>{displayName}</span>

//         </>
//     );
// };

/**
 * Cell Renderer
 * 
 * @param props 
 * @returns 
 */
const BoxedComboboxCellRenderer: React.FC<any> = ({ data, colId, colName, boxedColorColId, defaultColor }) => {

    const appContxt = useAppContext();
    const serviceLocator = appContxt.serviceLocator;

    const tableContext = useTableContext();

    const t = useTranslations();

    const cellContainerRef = useRef<HTMLDivElement>(null);
    const [_data, setData] = useState(data);

    const [bgColor, setBgColor] = useState<string>(IdsColor.PRIMARY);
    const [isEditing, setIsEditing] = useState(false);

    const getRelatedProperties = (
        colId: string,
        data: Record<string, unknown>
    ): {
        hasColor: boolean | null;
        hasId: boolean | null;
        colorKey: string | null;
        idKey: string | null;
    } => {
        // Verifica se colId termina con "Name"
        if (!colId.endsWith("Name")) {
            return { hasColor: null, hasId: null, colorKey: null, idKey: null };
        }

        // Rimuove il suffisso "Name" e costruisce le chiavi dinamiche
        const base = colId.slice(0, -4); // rimuove "Name"
        const colorKey = `${base}Color`;
        const idKey = `${base}Id`;

        return {
            hasColor: colorKey in data,
            hasId: idKey in data,
            colorKey,
            idKey,
        };
    }


    useEffect(() => {
        if (!data) return;
        setData(data);
    }, [data]);

    useEffect(() => {
        if (!_data) return;
        let _color = _data?.[boxedColorColId] ?? defaultColor;
        let _bgColor = UiHelper.getColor(_color);
        setBgColor(_bgColor.color);
    }, [_data]);

    // 2. Sostituisci l'useEffect esistente con questo
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                cellContainerRef.current &&
                !cellContainerRef.current.contains(e.target as Node)
            ) {
                setIsEditing(false);
            }
        };

        // mousedown intercetta prima che il focus si sposti
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing]);

    if (!_data?.[colId]) {
        return <span>{COL_EMPTY_PLACEHOLDER}</span>;
    }

    return (
        <div 
            ref={cellContainerRef} 
            onClick={() => !isEditing && setIsEditing(true)} 
            style={{ cursor: isEditing ? 'default' : 'pointer', width: '100%' }}
            title={`${t.common.actions.edit + ' ' + colName}`}
        >
            {!isEditing ? (
                <Badge bg="" style={{ backgroundColor: bgColor }} className='px-2 py-1'>
                    {_data?.[colId]?.toUpperCase()}
                </Badge>
            ) : (
                <TableCombobox
                    id={'t-0'}
                    domain={AppPathHelper.build(DOMAIN.TENDERS, SUBDOMAIN.TENDER_STATUSES)}
                    data={_data}
                    options={tableContext.comboboxMap.get(AppPathHelper.build(DOMAIN.TENDERS, SUBDOMAIN.TENDER_STATUSES) ?? [])}
                    selectedValue={data[colId]}
                    optionConfig={{ placeholder: 'Stato gara' } as ComboboxOptionConfig}
                    onChange={async (e) => {
                        let request = {
                            data: {
                                id: _data.id,
                                tenderStatusId: e.target.value
                            },
                            service: AppPathHelper.build(DOMAIN.TENDERS, SUBDOMAIN.TENDER_STATUSES, SERVICE_ENDPOINT.UPDATE)
                        } as ApiRequest;
                        let response = await serviceLocator.callService(request);

                        // let request = {
                        //     data: {
                        //         ...data,
                        //         tenderStatusId: e.target.value
                        //     },
                        //     service: AppPathHelper.build(DOMAIN.TENDERS, SERVICE_ENDPOINT.UPDATE)
                        // } as ApiRequest;
                        // let response = await serviceLocator.callService(request);

                        let relatedProps = getRelatedProperties(colId, _data);
                        
                        setData((prev) => ({
                            ...prev,
                            [colId]: e.target.raw.name,
                            ...(relatedProps.colorKey && { [relatedProps.colorKey]: e.target.raw.color ?? 'yellow' }),
                            ...(relatedProps.idKey && { [relatedProps.idKey]: e.target.raw.id }),
                        }));

                        // data[colId] = e.target.raw.name;
                        // data['tenderStatusColor'] = e.target.raw.color ?? 'yellow';
                        // data['tenderStatusId'] = e.target.raw.id;


                        // qui gestisci il cambio valore, es. aggiorna data o chiama una callback
                        setIsEditing(false);
                    }}
                    disabled={false}
                    required={false}
                />
            )}
        </div>
    );
};

export default BoxedComboboxCellRenderer;
// export { BoxedTextHeader }
