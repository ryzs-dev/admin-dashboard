type UITemplate = {
    id: string;
    name: string;
    language: string;
    status: string;
    body: string;
    buttons: any[];
    variables: string[];
  };
  
export function transformMetaTemplate(template: any): UITemplate {
    const bodyComponent = template.components.find((c: any) => c.type === 'BODY');
  
    const buttonComponent = template.components.find(
      (c: any) => c.type === 'BUTTONS'
    );
  
    const bodyText = bodyComponent?.text || '';
  
    // Extract variables like {{1}}, {{2}}
    const variables =
      bodyText.match(/{{\d+}}/g)?.map((v: string) => v.replace(/[{}]/g, '')) ||
      [];
  
    return {
      id: template.id,
      name: template.name,
      language: template.language,
      status: template.status,
      body: bodyText,
      buttons: buttonComponent?.buttons || [],
      variables,
    };
  }