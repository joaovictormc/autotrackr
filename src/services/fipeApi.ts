import axios from 'axios';

const FIPE_API_URL = 'https://parallelum.com.br/fipe/api/v1/carros';

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: string;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipeModelResponse {
  modelos: FipeModel[];
  anos: FipeYear[];
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

const fipeApi = {
  /**
   * Busca todas as marcas de veículos
   */
  getBrands: async (): Promise<FipeBrand[]> => {
    try {
      const response = await axios.get<FipeBrand[]>(`${FIPE_API_URL}/marcas`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar marcas:', error);
      throw error;
    }
  },

  /**
   * Busca todos os modelos de uma marca específica
   * @param brandCode - Código da marca
   */
  getModels: async (brandCode: string): Promise<FipeModelResponse> => {
    try {
      const response = await axios.get<FipeModelResponse>(`${FIPE_API_URL}/marcas/${brandCode}/modelos`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar modelos para a marca ${brandCode}:`, error);
      throw error;
    }
  },

  /**
   * Busca todos os anos disponíveis para um modelo específico
   * @param brandCode - Código da marca
   * @param modelCode - Código do modelo
   */
  getYears: async (brandCode: string, modelCode: string): Promise<FipeYear[]> => {
    try {
      const response = await axios.get<FipeYear[]>(
        `${FIPE_API_URL}/marcas/${brandCode}/modelos/${modelCode}/anos`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar anos para o modelo ${modelCode}:`, error);
      throw error;
    }
  },

  /**
   * Busca informações detalhadas de um veículo específico
   * @param brandCode - Código da marca
   * @param modelCode - Código do modelo
   * @param yearCode - Código do ano
   */
  getVehicleInfo: async (brandCode: string, modelCode: string, yearCode: string): Promise<FipeVehicleInfo> => {
    try {
      const response = await axios.get<FipeVehicleInfo>(
        `${FIPE_API_URL}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`
      );
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar informações do veículo:`, error);
      throw error;
    }
  }
};

export default fipeApi; 