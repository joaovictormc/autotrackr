import axios from 'axios';

const BASE_URL = 'https://parallelum.com.br/fipe/api/v1';

export interface FipeBrand {
  code: string;
  name: string;
}

export interface FipeModel {
  code: string;
  name: string;
}

export interface FipeYear {
  code: string;
  name: string;
}

export interface FipeModelResponse {
  models: FipeModel[];
}

export interface FipeVehicleInfo {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  tipoVeiculo: number;
  siglaCombustivel: string;
}

/**
 * Busca todas as marcas de veículos
 */
export const getBrands = async (): Promise<FipeBrand[]> => {
  try {
    const response = await axios.get<FipeBrand[]>(`${BASE_URL}/carros/marcas`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
    throw error;
  }
};

/**
 * Busca todos os modelos de uma marca específica
 * @param brandCode - Código da marca
 */
export const getModels = async (brandCode: string): Promise<FipeModelResponse> => {
  try {
    const response = await axios.get<FipeModelResponse>(`${BASE_URL}/carros/marcas/${brandCode}/modelos`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar modelos para a marca ${brandCode}:`, error);
    throw error;
  }
};

/**
 * Busca todos os anos disponíveis para um modelo específico
 * @param brandCode - Código da marca
 * @param modelCode - Código do modelo
 */
export const getYears = async (brandCode: string, modelCode: string): Promise<FipeYear[]> => {
  try {
    const response = await axios.get<FipeYear[]>(
      `${BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos`
    );
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar anos para o modelo ${modelCode}:`, error);
    throw error;
  }
};

/**
 * Busca informações detalhadas de um veículo específico
 * @param brandCode - Código da marca
 * @param modelCode - Código do modelo
 * @param yearCode - Código do ano
 */
export const getVehicleInfo = async (brandCode: string, modelCode: string, yearCode: string): Promise<FipeVehicleInfo> => {
  try {
    const response = await axios.get<FipeVehicleInfo>(
      `${BASE_URL}/carros/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`
    );
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar informações do veículo:`, error);
    throw error;
  }
};

// Exporta também o objeto completo para manter compatibilidade
export default {
  getBrands,
  getModels,
  getYears,
  getVehicleInfo
}; 