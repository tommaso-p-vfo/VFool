export default interface ApiRequest {

    //service name - DOMAIN + [SUBDOMAIN] + service end point (es. auth.login | configuration.tenderTypes.save)
    service: string;
    //payload/query string
    data: any;
    finallyCallback: () => void; //chiamata da fare a prescindere dal risultato
    metadata?: any; //parametri aggiuntivi necessari al serviceLocator. es. userId o agentId per filtri specifici (only mine filter)

}