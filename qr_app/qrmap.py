# My-QR.Art - A web app to design QR codes for your URL.
# Copyright (C) 2021 Marien Raat - mail@marienraat.nl

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
import qr_app.tables as t
import png
import qr_app.pyqrcode as pyqrcode
from enum import Enum


class ModuleType(Enum):
    AVAILABLE = 1  # Available for data
    RESERVED = 2  # Reserved for special data (but part of the interleaving)
    BLOCKED = 3  # Blocked for special patterns

    def to_char(module):
        if module == ModuleType.AVAILABLE:
            return '1'
        elif module == ModuleType.RESERVED:
            return '2'
        elif module == ModuleType.BLOCKED:
            return '0'

    def to_color(module):
        if module == ModuleType.AVAILABLE:
            return 255
        elif module == ModuleType.RESERVED:
            return 128
        elif module == ModuleType.BLOCKED:
            return 128


class QrMap:
    def __init__(self, version, value=ModuleType.AVAILABLE):
        self.size = t.version_size[version]
        self.qr = [value] * (self.size * self.size)

    def set(self, x, y, value):
        if x >= self.size or x < 0 or y >= self.size or y < 0:
            raise 'Error'
        self.qr[x + y * self.size] = value

    def get(self, x, y):
        if x >= self.size or x < 0 or y >= self.size or y < 0:
            raise 'Error'
        return self.qr[x + y * self.size]

    def get_with_mask(self, x, y):
        mask = (y % 2) == 0
        bit = self.get(x, y)
        if mask:
            if bit == ModuleType.AVAILABLE:
                return ModuleType.BLOCKED
            else:
                return ModuleType.AVAILABLE
        else:
            return bit

    def to_string(self):
        string = ''
        for y in range(0, self.size):
            for x in range(0, self.size):
                string += ModuleType.to_char(self.get(x, y))
            string += '\n'
        return string

    def save(self, filename):
        image = []
        for y in range(0, self.size):
            row = []
            for x in range(0, self.size):
                row.append(ModuleType.to_color(self.get(x, y)))
            image.append(row)
        png.from_array(image, 'L').save(filename)

    def get_version(self):
        for (i, size) in enumerate(t.version_size):
            if size == self.size:
                return i
        raise ValueError('Size not found!')

    def read_file(f):
        (width, height, rows, info) = png.Reader(file=f).read()
        qr = QrMap(1, ModuleType.BLOCKED)
        qr.size = width
        qr.qr = [ModuleType.BLOCKED] * (qr.size * qr.size)
        y = 0
        for row in rows:
            x = 0
            for pixel in row:
                if pixel < 128:
                    qr.set(x, y, ModuleType.AVAILABLE)
                x += 1
            y += 1
        return qr

    def read(filename):
        return QrMap.read_file(open(filename, 'rb'))

    def from_array(arr):
        width = len(arr)
        height = len(arr[0])
        qr = QrMap(1, ModuleType.BLOCKED)
        qr.size = width
        qr.qr = [ModuleType.BLOCKED] * (qr.size * qr.size)
        for y in range(0, height):
            for x in range(0, width):
                if arr[x][y][0] < 128:
                    qr.set(x, y, ModuleType.AVAILABLE)
        return qr

    def to_json_rep(self):
        return {
            'width': self.size,
            'height': self.size,
            'map': list(map(lambda x: x.to_char(), self.qr)),
        }


def add_square(qr, x, y, size, value=ModuleType.BLOCKED):
    add_rect(qr, x, y, size, size, value)


def add_rect(qr, x, y, width, height, value=ModuleType.BLOCKED):
    for xi in range(x, x+width):
        for yi in range(y, y+height):
            qr.set(xi, yi, value)


def get_path(qr, allowed_modules=[ModuleType.AVAILABLE]):
    """Returns a list of coordinates of the data flow through a
    QR code where True values are places data can go and False where
    it can't."""
    x = y = qr.size - 1
    path = []
    up = True
    is_left = False
    while True:
        if (up and x == 0 and y == 0) or ((not up) and x == 0
                                          and y == (qr.size - 1)):
            return path
        if qr.get(x, y) in allowed_modules:
            path.append((x, y))

        if not is_left:
            x -= 1
            is_left = True
        else:
            is_left = False
            if up:
                if y == 0:
                    up = False
                    x -= 1

                    # Special case, vertical timing
                    if x == 6:
                        x -= 1
                else:
                    y -= 1
                    x += 1
            else:
                if y == (qr.size - 1):
                    up = True
                    x -= 1

                    # Special case, vertical timing
                    if x == 6:
                        x -= 1
                else:
                    y += 1
                    x += 1


def get_qr_path(version, mode, error, url):
    qr = QrMap(version)

    # Add finder patterns and seperators and format info area
    finder_size = 8
    add_square(qr, 0, 0, finder_size + 1)
    add_rect(qr, qr.size - finder_size, 0, finder_size, finder_size + 1)
    add_rect(qr, 0, qr.size - finder_size, finder_size + 1, finder_size)

    # Add position adjustment patterns
    places = t.position_adjustment[version]
    if places is not None:
        first_place = places[0]
        last_place = places[len(places)-1]
        for x in places:
            for y in places:
                if (
                        (x == first_place and y == first_place) or
                        (x == first_place and y == last_place) or
                        (x == last_place and y == first_place)):
                    # Can't overlap with the finder patterns
                    continue
                add_square(qr, x-2, y-2, 5)

    # Add timing patterns
    add_rect(qr, 6, 0, 1, qr.size)
    add_rect(qr, 0, 6, qr.size, 1)

    # Add version info area
    if version >= 7:
        add_rect(qr, qr.size - finder_size - 3, 0, 3, 6)
        add_rect(qr, 0, qr.size - finder_size - 3, 6, 3)

    return get_path(qr)


def get_qr_map(version, mode='binary', error='L', url=''):
    """Returns a 2d array of the size of an qr code of the version.
    Where we can write data it puts True. Everywhere else is False.
    """
    path = interleave_path(get_qr_path(version, mode, error, url),
                           version, error)
    final_qr = QrMap(version, ModuleType.BLOCKED)

    mode_size = 4
    dlversion = 9
    if version > 9:
        dlversion = 26
    if version > 26:
        dlversion = 40
    count_size = t.data_length_field[dlversion][t.modes[mode]]
    url_size = (int(len(url) / 2.0 * 11.0)
                if mode == 'alphanumeric'
                else (len(url) * 8))
    skipped = mode_size + count_size + url_size

    data_size = t.data_capacity[version][error][0]

    for (x, y) in path[:skipped]:
        final_qr.set(x, y, ModuleType.RESERVED)

    for (x, y) in path[skipped:data_size]:
        final_qr.set(x, y, ModuleType.AVAILABLE)

    return final_qr


def get_error_reserved_map(version, mode='binary', error='L', url=''):
    path = get_qr_path(version, mode, error, url)
    final_qr = QrMap(version, ModuleType.AVAILABLE)
    data_size = t.data_capacity[version][error][0]
    e = t.eccwbi[version][error]
    error_size = 8 * (e[0] * e[1] + e[0] * e[2])

    print(path)
    print(len(path))
    print(data_size)
    print(error_size)
    for (x, y) in path[data_size:(data_size+error_size)]:
        final_qr.set(x, y, ModuleType.RESERVED)

    return final_qr

def get_qr_map_with_hints(version, mode='binary', error='L', url=''):
    qrmap = get_qr_map(version, mode, error, url)
    error_map = get_error_reserved_map(version, mode, error, url)
    qr = create_qr_from_map(qrmap, url, mode, error)
    map_with_hints = QrMap(qr.version)
    for y in range(qrmap.size):
        for x in range(qrmap.size):
            if qrmap.get(x, y) != ModuleType.AVAILABLE:
                if qr.code[y][x] == 0 or error_map.get(x, y) == ModuleType.RESERVED:
                    map_with_hints.set(x, y, ModuleType.BLOCKED)
                else:
                    map_with_hints.set(x, y, ModuleType.RESERVED)
            else:
                map_with_hints.set(x, y, ModuleType.AVAILABLE)
    return map_with_hints


def get_qr_template(version, filename='qrtemplate.png', mode='binary', error='L'):
    qr = get_qr_map(version, mode, error)
    qr.save(filename)


def interleave_path(path, version, error):
    interleaved_path = []

    # Put it in the groups and boxes
    [_, b1c, b1w, b2c, b2w] = t.eccwbi[version][error]

    sizes = [b1w]*b1c + [b2w]*b2c
    boxes = len(sizes)
    for (i, size) in enumerate(sizes):
        for j in range(size):
            for k in range(8):
                dif = 0
                for g in sizes[:i]:
                    if g > j:
                        dif += 1
                interleaved_path.append(path[(dif + j * boxes) * 8 + k])

    return interleaved_path


def get_raw_qr_data(design, error='L', mode='binary'):
    version = design.get_version()
    qrmap = get_qr_map(version, error=error, mode=mode)

    # We take the path with the reserved parts,
    # because we need to interleave it.
    path = get_path(qrmap, [ModuleType.AVAILABLE, ModuleType.RESERVED])

    interleaved_path = interleave_path(
        path, version, error)

    data = ""

    for (x, y) in interleaved_path:
        if qrmap.get(x, y) == ModuleType.AVAILABLE:
            data += ('1'
                     if design.get_with_mask(x, y) == ModuleType.AVAILABLE
                     else '0')

    return (data, version)

def create_qr_from_map(design, url, mode, error):
    (bits, version) = get_raw_qr_data(design, error, mode)
    string = (bitstring_to_bin(bits) if mode == 'binary'
              else bitstring_to_alphanumeric(bits))
    with_url = url + '/' + string[(len(url)+1):]
    qr = pyqrcode.create(with_url, error=error, mode=mode, version=version)
    return qr

def create_qr_from_design(filename, url, mode, error):
    return create_qr_from_map(QrMap.read(filename), url, mode, error)

def bitstring_to_bytes(s):
    b = bytearray()
    for i in range(int(len(s) / 8)):
        one = s[(i*8):((i+1)*8)]
        b.append(int(one, 2))
    return bytes(b)

def find_table_char(num):
    for c, n in t.ascii_codes.items():
        if num == n:
            return c

def bitstring_to_alphanumeric(s):
    text = ''

    while len(s) >= 11:
        part = s[:11]
        s = s[11:]
        num = int(part, 2)
        c1 = min(44, num // 45)
        c2 = num % 45
        text += find_table_char(c1) + find_table_char(c2)

    if len(s) >= 6:
        num = min(44, int(s[:6], 2))
        text += find_table_char(num)

    return text

def bitstring_to_bin(s):
    return bitstring_to_bytes(s).decode('ISO 8859-1')
