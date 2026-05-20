export interface PromptFields {
  role: string;
  task: string;
  context: string;
  inputData: string;
  outputFormat: string;
  constraints: string;
  tone: string;
  example: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  fields: PromptFields;
}
