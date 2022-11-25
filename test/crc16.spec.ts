import {crc16} from "../src/utils/crc16";

describe('crc16', () => {
    it('should hash correctly', async () => {
        expect(crc16('get_seq')).toEqual(38947)
    })
})