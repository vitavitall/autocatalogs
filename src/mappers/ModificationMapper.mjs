import { BODIES, TRANSMISSIONS, DRIVES } from '../constants.mjs';

export default class ModificationMapper {
	/**
	 *
	 * Метод отдает несколько маппированных параметров, не только моификации,
	 * выполнено таким образом чтоб не делать лишних проходов по массиву данных модификаций,
	 * есть проверка на удаление модификации с Авито
	 *
	 * @param {Array} modificationsFromCatalog
	 * @param {Array} savedModifications массив модификаций, сохраненных в базе ранее
	 * @returns {Object}
	 * modifications - массив отформатированных моделей для сохранения данных,
	 * bodies - массив отформатированных типов кузовов сохранения данных
	 * drives - массив отформатированных типов приводов сохранения данных
	 * modelBody - массив id
	 * modelTransmission - массив id
	 * modelDrive - массив id
	 */
	map(modificationsFromCatalog, savedModifications) {
		const bodies = [];
		const transmissions = [];
		const modelBody = [];
		const modelTransmission = [];
		const drives = [];
		const modelDrive = [];
		const modifications = new Map();

		modificationsFromCatalog.forEach((item) => {
			const {
				Modification,
				Model,
				Transmission,
				BodyType,
				DriveType,
				YearFrom,
				YearTo,
				EngineSize,
				Power
			} = item;

			this.paramsMapper(bodies, BodyType, BODIES);
			this.paramsMapper(transmissions, Transmission, TRANSMISSIONS);
			this.paramsMapper(drives, DriveType, DRIVES);
			this.modelBodyMapper(Model, BodyType, modelBody);
			this.modelTransmissionMapper(Model, Transmission, modelTransmission);
			this.modelDriveMapper(Model, DriveType, modelDrive);

			const res = {
				avitoModificationId: Number(Modification[0].id[0]),
				name: Modification[0]._,
				vehicleModelId: Number(Model[0].id[0]),
				vehicleTransmissionId: Number(Transmission[0].id[0]),
				vehicleBodyId: Number(BodyType[0].id[0]),
				vehicleDriveId: Number(DriveType[0].id[0]),
				vehicleYear: YearFrom ? Number(YearFrom[0]._) : 0,
				vehicleYearFrom: YearFrom ? Number(YearFrom[0]._) : 0,
				vehicleYearTo: YearTo ? Number(YearTo[0]._) : 0,
				vehicleEnginePower: Power ? Number(Power[0]._) : 0,
				vehicleEngineCapacity: EngineSize ? Number(EngineSize[0]._).toFixed(1) : '0'
			};
			const transmissionCode = TRANSMISSIONS.find(({ name }) =>
			 name === Transmission[0]._.toLowerCase()).code;
			res.code = this.codeAdapter(res.vehicleEnginePower, res.vehicleEngineCapacity, transmissionCode);

			const key = this.objectStringificator(res);
			if (!modifications.has(key)) {
				res.id = modifications.size + 1;
				modifications.set(key, res)
			}
		});

		savedModifications.forEach((item) => {
			const key = this.objectStringificator(item);
			if (!modifications.has(key)) {
				item.id = modifications.size + 1;
				modifications.set(key, item);
			}
		})

		return {
			modifications: [...modifications.values()],
			bodies,
			transmissions,
			modelBody,
			modelTransmission,
			drives,
			modelDrive
		};
	}

	/**
	 * Метод принимает модификацию, приводит к общему виду и возвращает в формате JSON
	 * @param {Object} obj 
	 * @returns {JSON}
	 */
	objectStringificator(obj) {
		return JSON.stringify({
			'avitoModificationId': obj.avitoModificationId,
			'name': obj.name,
			'vehicleModelId': obj.vehicleModelId,
			'vehicleTransmissionId': obj.vehicleTransmissionId,
			'vehicleDriveId': obj.vehicleDriveId,
			'vehicleYear': obj.vehicleYear,
			'vehicleYearFrom': obj.vehicleYearFrom,
			'vehicleYearTo': obj.vehicleYearTo,
			'vehicleEnginePower': obj.vehicleEnginePower, 
			'vehicleEngineCapacity': Number(obj.vehicleEngineCapacity).toFixed(1),
			'code': obj.code
		})
	}

	/**
	 * Метод формирует и возвращает параметр для оценки code
	 * @param {Number} vehiclePower мощность двигателя
	 * @param {Number} engineVolume обьем в литрах
	 * @param {Number} transmissionCode код трансмиссии
	 * @return {String} transmissionCode__vehiclePower__engineVolume
	 */
	codeAdapter(vehiclePower, engineVolume, transmissionCode) {
		const format = (value) => {
			const more = value.replace(/\./g, '_');
			const less = value + '_0';
			return value.includes('.') ? more : less;
		};
		return `${transmissionCode}__${vehiclePower}__${format(engineVolume.toString())}`;
	}

	/**
	 *  Метод формирует массив с выбранными параметрами убирая повторяющиеся элементы
	 *  реализован для единоразового обхода по массиву параметров модификации
	 * @param {Array} arr массив для сохранения выделенных параметров
	 * @param {Object} value выбранный параметр из обьекта с параметрами модификации
	 * @param {Array} types массив с параметрами модификаций зашитых в платформе
	 *
	 */
	paramsMapper(arr, value, types) {
		const typeCode = types.find(({ name }) => name === value[0]._.toLowerCase());
		const formatValue = {
			id: Number(value[0].id[0]),
			name: value[0]._.toLowerCase(),
			code: typeCode.code,
			avitoCode: typeCode.code
		};
		if (!arr.map(({ id }) => id).includes(formatValue.id)) {
			arr.push(formatValue);
		}
	}

	/**
	 *  Метод формирует массив с выбранными параметрами убирая повторяющиеся элементы
	 *  реализован для единоразового обхода по массиву параметров
	 * @param {Object} model выбранный параметр из обьекта с параметрами модификации Model
	 * @param {Object} body выбранный параметр из обьекта с параметрами модификации BodyType
	 * @param {Array} vehicleModelBody массив с результатами работы метода
	 *
	 */
	modelBodyMapper(model, body, vehicleModelBody) {
		if (
			!vehicleModelBody.find(
				({ vehicleModelId, vehicleBodyId }) =>
					vehicleModelId === Number(model[0].id[0]) && vehicleBodyId === Number(body[0].id[0])
			)
		) {
			vehicleModelBody.push({
				vehicleModelId: Number(model[0].id[0]),
				vehicleBodyId: Number(body[0].id[0])
			});
		}
	}

	/**
	 *  Метод формирует массив с выбранными параметрами убирая повторяющиеся элементы
	 *  реализован для единоразового обхода по массиву параметров
	 * @param {Object} model выбранный параметр из обьекта с параметрами модификации Model
	 * @param {Object} transmission выбранный параметр из обьекта с параметрами модификации Transmission
	 * @param {Array} vehicleModelTransmission массив с результатами работы метода
	 *
	 */
	modelTransmissionMapper(model, transmission, vehicleModelTransmission) {
		if (
			!vehicleModelTransmission.find(
				({ vehicleModelId, vehicleTransmissionId }) =>
					vehicleModelId === Number(model[0].id[0]) &&
					vehicleTransmissionId === Number(transmission[0].id[0])
			)
		) {
			vehicleModelTransmission.push({
				vehicleModelId: Number(model[0].id[0]),
				vehicleTransmissionId: Number(transmission[0].id[0])
			});
		}
	}

	/**
	 *  Метод формирует массив с выбранными параметрами убирая повторяющиеся элементы
	 *  реализован для единоразового обхода по массиву параметров
	 * @param {Object} model выбранный параметр из обьекта с параметрами модификации Model
	 * @param {Object} drive выбранный параметр из обьекта с параметрами модификации DriveType
	 * @param {Array} vehicleModelDrive массив с результатами работы метода
	 *
	 */
	modelDriveMapper(model, drive, vehicleModelDrive) {
		if (
			!vehicleModelDrive.find(
				({ vehicleModelId, vehicleDriveId }) =>
					vehicleModelId === Number(model[0].id[0]) && vehicleDriveId === Number(drive[0].id[0])
			)
		) {
			vehicleModelDrive.push({
				vehicleModelId: Number(model[0].id[0]),
				vehicleDriveId: Number(drive[0].id[0])
			});
		}
	}
}
